// src/lib/savedSearchesService.ts
// Service for managing saved searches, buyer watchlists, and automated new-product email alerts

import { supabase } from './supabase';
import { StructuredFilters } from './productSearchEngine';

export interface SavedSearch {
  id: string;
  user_id?: string;
  title: string;
  query: string;
  filters: StructuredFilters;
  alert_frequency: 'instant' | 'daily' | 'weekly' | 'none';
  new_items_count: number;
  last_notified_at?: string;
  created_at: string;
}

const LOCAL_STORAGE_KEY = 'ethimarket_saved_searches';

export class SavedSearchesService {
  /**
   * Load saved searches from Supabase or localStorage fallback
   */
  static async getSavedSearches(userId?: string): Promise<SavedSearch[]> {
    if (userId) {
      try {
        const { data, error } = await supabase
          .from('saved_searches')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data as SavedSearch[];
        }
      } catch (err) {
        console.warn('Could not fetch saved searches from DB, falling back to local storage', err);
      }
    }

    // LocalStorage fallback
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw) as SavedSearch[];
      }
    } catch {
      // ignore
    }
    return [];
  }

  /**
   * Save a new search with configured alert parameters
   */
  static async saveSearch(
    title: string,
    query: string,
    filters: StructuredFilters,
    alertFrequency: 'instant' | 'daily' | 'weekly' | 'none' = 'weekly',
    userId?: string
  ): Promise<SavedSearch> {
    const newEntry: SavedSearch = {
      id: 'search_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      user_id: userId,
      title: title || query || 'Recherche personnalisée',
      query,
      filters,
      alert_frequency: alertFrequency,
      new_items_count: 0,
      created_at: new Date().toISOString()
    };

    if (userId) {
      try {
        const { data, error } = await supabase
          .from('saved_searches')
          .insert({
            user_id: userId,
            title: newEntry.title,
            query: newEntry.query,
            filters: newEntry.filters,
            alert_frequency: newEntry.alert_frequency
          })
          .select()
          .single();

        if (!error && data) {
          return data as SavedSearch;
        }
      } catch (err) {
        console.warn('DB insert failed for saved search, caching locally', err);
      }
    }

    // LocalStorage cache
    try {
      const current = await this.getSavedSearches();
      const updated = [newEntry, ...current.filter(s => s.id !== newEntry.id)];
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }

    return newEntry;
  }

  /**
   * Delete a saved search
   */
  static async deleteSavedSearch(id: string, userId?: string): Promise<boolean> {
    if (userId) {
      try {
        await supabase.from('saved_searches').delete().eq('id', id).eq('user_id', userId);
      } catch {
        // ignore
      }
    }

    try {
      const current = await this.getSavedSearches();
      const updated = current.filter(s => s.id !== id);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Update notification frequency
   */
  static async updateFrequency(
    id: string,
    frequency: 'instant' | 'daily' | 'weekly' | 'none',
    userId?: string
  ): Promise<void> {
    if (userId) {
      try {
        await supabase
          .from('saved_searches')
          .update({ alert_frequency: frequency })
          .eq('id', id)
          .eq('user_id', userId);
      } catch {
        // ignore
      }
    }

    try {
      const current = await this.getSavedSearches();
      const updated = current.map(s => (s.id === id ? { ...s, alert_frequency: frequency } : s));
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }
}
