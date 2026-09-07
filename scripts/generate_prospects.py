#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Génère public/data/prospects.json à partir de la base producteur Ethimarket
(../ethimarket/base_producteurs_ethimarket.csv ou DATA_DIR/base_producteurs_ethimarket.csv).

Usage:
    python3 scripts/generate_prospects.py [chemin/vers/base_producteurs_ethimarket.csv]

Le JSON est compact (clés courtes) : voir src/lib/producerProspects.ts pour le schéma.
Régénérer ce fichier à chaque mise à jour de la base producteur, puis committer.
"""
import csv
import json
import os
import re
import sys
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, "public", "data", "prospects.json")

CANDIDATS = [
    os.path.join(ROOT, "data", "base_producteurs_ethimarket.csv"),
    os.path.expanduser("~/ethimarket/base_producteurs_ethimarket.csv"),
    "/home/user/ethimarket/base_producteurs_ethimarket.csv",
]

SRC_COLS = {
    "n": "Nom du producteur",
    "c": "Pays",
    "k": "Continent",
    "r": "Région / Ville",
    "t": "Type de producteur",
    "p": "Produits principaux",
    "b": "Bio",
    "f": "Équitable",
    "z": "Certification",
    "w": "Site internet",
    "e": "Email",
    "h": "Téléphone",
    "a": "WhatsApp",
    "l": "LinkedIn",
    "i": "Instagram",
    "o": "Facebook",
    "m": "Contact / Responsable",
    "d": "Adresse",
    "s": "Source",
    "x": "Notes",
}

VIDE = {"", "non trouvé", "non précisé", "non trouve", "n/a", "na", "-", "à vérifier"}


def nettoie(v: str) -> str:
    v = (v or "").strip()
    return "" if v.lower() in VIDE else v


def cat_of(products: str) -> str:
    """Même catégorisation que la base (scripts Python du data pipeline)."""
    p = (products or "").lower()

    def has(*kw):
        return any(k in p for k in kw)

    if has("café", "coffee"):
        return "Café"
    if has("cacao", "cocoa", "chocolat"):
        return "Cacao"
    if has("thé", "tea") and not has("herbal"):
        return "Thé"
    if has("miel", "honey", "bee", "apicole", "cire"):
        return "Miel & produits de la ruche"
    if has("argan", "olive", "huile", "oil") and not has("essential"):
        return "Huiles"
    if has("huile essentielle", "essential oil", "plante médicinale", "medicinal",
           "aromatique", "infusion", "herbal", "herbes", "plantes"):
        return "Plantes, herbes & huiles essentielles"
    if has("épice", "spice", "poivre", "pepper", "cardamome", "gingembre", "ginger",
           "curcuma", "turmeric", "cannelle", "vanille", "vanilla", "clou de girofle", "cumin"):
        return "Épices"
    if has("karité", "shea", "cajou", "cashew", "noix", "nut", "amande", "almond",
           "sésame", "sesame", "oléagineux", "oilseed"):
        return "Fruits à coque & oléagineux"
    if has("banane", "banana", "mangue", "mango", "ananas", "pineapple", "fruit", "agrume",
           "citrus", "citron", "orange", "raisin", "grape", "avocat", "avocado", "papaye",
           "pomme", "poire", "fraise", "melon"):
        return "Fruits"
    if has("légume", "vegetable", "maraîch", "horticult", "tomate", "oignon", "chou",
           "carotte", "pomme de terre", "potato", "onion", "okra", "aubergine", "brinjal"):
        return "Légumes & maraîchage"
    if has("coton", "cotton", "textile", "fashion", "vêtement", "garment", "tissu",
           "artisanat", "craft", "décor", "home", "stationery", "papier", "jouet", "bijou",
           "jewell", "ceramic", "poterie", "vannerie", "basket"):
        return "Textile, artisanat & décoration"
    if has("cosmétique", "beauty", "bien-être", "savon", "soap", "baume", "crème"):
        return "Cosmétiques naturels"
    if has("sucre", "sugar", "panela", "sirop"):
        return "Sucre / panela"
    if has("fleur", "flower", "rose", "plante ornementale"):
        return "Fleurs & plantes"
    if has("vin", "wine", "raisin de cuve"):
        return "Vin"
    if has("quinoa", "céréale", "cereal", "riz", "rice", "paddy", "maïs", "maize", "blé",
           "wheat", "orge", "barley", "mil", "millet", "sorgho", "avoine", "kiwicha",
           "chia", "lin", "linseed"):
        return "Céréales & graines"
    if has("lait", "dairy", "fromage", "cheese", "œuf", "egg", "viande", "meat", "volaille",
           "poultry", "poisson", "fish", "crevette"):
        return "Élevage & produits animaliers"
    if has("transformation", "processed", "jus", "juice", "confiture", "jam", "chips",
           "farine", "flour", "séché", "dried", "torréfié", "roasted", "bière", "beer",
           "cacao en poudre"):
        return "Produits transformés"
    if not p:
        return "Non précisé"
    return "Autres produits agricoles"


def main() -> int:
    src = sys.argv[1] if len(sys.argv) > 1 else next((p for p in CANDIDATS if os.path.exists(p)), None)
    if not src:
        print("ERREUR: base_producteurs_ethimarket.csv introuvable. Fournir le chemin en argument.")
        return 1

    with open(src, newline="", encoding="utf-8-sig") as fh:
        rows = list(csv.DictReader(fh))

    out = []
    for idx, r in enumerate(rows, 1):
        rec = {k: nettoie(r.get(col, "")) for k, col in SRC_COLS.items()}
        rec["g"] = cat_of(rec["p"])
        rec["id"] = f"ETH-{idx:05d}"
        out.append(rec)

    # Tri : pays → catégorie → nom (même ordre que la base exportée)
    out.sort(key=lambda x: (x["c"] or "zz", x["g"], x["n"]))
    for idx, rec in enumerate(out, 1):
        rec["id"] = f"ETH-{idx:05d}"

    payload = {
        "generatedAt": date.today().isoformat(),
        "source": "Base producteurs Ethimarket — annuaires publics certifiés (Fairtrade/FLOCERT, WFTO, PromPerú, NSTIAM, Spices Board India, TNAU, Conseil Café-Cacao, Conseil oléicole international, IFOAM, sites officiels de coopératives)",
        "total": len(out),
        "countries": len({x["c"] for x in out if x["c"]}),
        "withEmail": sum(1 for x in out if x["e"]),
        "withPhone": sum(1 for x in out if x["h"]),
        "withWebsite": sum(1 for x in out if x["w"]),
        "withWhatsapp": sum(1 for x in out if x["a"]),
        "withContact": sum(1 for x in out if x["m"]),
        "producers": out,
    }

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as fh:
        json.dump(payload, fh, ensure_ascii=False, separators=(",", ":"))

    taille = os.path.getsize(OUT) / 1024
    print(f"OK  {OUT}")
    print(f"    {len(out)} producteurs | {payload['countries']} pays | "
          f"emails {payload['withEmail']} | tél {payload['withPhone']} | sites {payload['withWebsite']} | {taille:.0f} Ko")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
