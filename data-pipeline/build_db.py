# -*- coding: utf-8 -*-
"""Agrège toutes les sources en une base unique au schéma Ethimarket."""
import json, re, os, csv, unicodedata

COLS=["ID","Nom du producteur","Pays","Continent","Région / Ville","Type de producteur","Produits principaux",
      "Bio","Équitable","Certification","Site internet","Email","Téléphone","WhatsApp","LinkedIn","Instagram",
      "Facebook","Contact / Responsable","Adresse","Source","Notes"]

FR={"Ivory Coast":"Côte d'Ivoire","Peru":"Pérou","Colombia":"Colombie","India":"Inde","Kenya":"Kenya","Ecuador":"Équateur",
 "Honduras":"Honduras","Dominican Republic":"République dominicaine","Brazil":"Brésil","Mexico":"Mexique","Madagascar":"Madagascar",
 "Sri Lanka":"Sri Lanka","China, Peoples Republic of":"Chine","Uganda":"Ouganda","Ghana":"Ghana","Nicaragua":"Nicaragua",
 "South Africa":"Afrique du Sud","Vietnam":"Vietnam","Bolivia":"Bolivie","Guatemala":"Guatemala","Indonesia":"Indonésie",
 "Rwanda":"Rwanda","Egypt":"Égypte","Mauritius":"Maurice","Burkina Faso":"Burkina Faso","Thailand":"Thaïlande","Ethiopia":"Éthiopie",
 "Pakistan":"Pakistan","Tanzania":"Tanzanie","Sierra Leone":"Sierra Leone","Malawi":"Malawi","Costa Rica":"Costa Rica",
 "Panama":"Panama","Paraguay":"Paraguay","Philippines":"Philippines","Nepal":"Népal","Bangladesh":"Bangladesh","Cambodia":"Cambodge",
 "Lao People's Democratic Republic":"Laos","Myanmar":"Myanmar","Papua New Guinea":"Papouasie-Nouvelle-Guinée","Timor-Leste":"Timor oriental",
 "Congo, The Democratic Republic of the":"RD Congo","Congo, Republic of the":"Congo","Cameroon":"Cameroun","Benin":"Bénin","Togo":"Togo",
 "Mali":"Mali","Senegal":"Sénégal","Guinea":"Guinée","Liberia":"Liberia","Nigeria":"Nigeria","Zambia":"Zambie","Zimbabwe":"Zimbabwe",
 "Mozambique":"Mozambique","Burundi":"Burundi","Ethiopia":"Éthiopie","Jamaica":"Jamaïque","Haiti":"Haïti","Cuba":"Cuba",
 "El Salvador":"Salvador","Chile":"Chili","Argentina":"Argentine","Uruguay":"Uruguay","Venezuela":"Venezuela","Guyana":"Guyana",
 "Fiji":"Fidji","Samoa":"Samoa","Tonga":"Tonga","Vanuatu":"Vanuatu","Solomon Islands":"Îles Salomon","New Zealand":"Nouvelle-Zélande",
 "Australia":"Australie","Turkey":"Turquie","Lebanon":"Liban","Palestine, State of":"Palestine","Jordan":"Jordanie","Morocco":"Maroc",
 "Tunisia":"Tunisie","Algeria":"Algérie","United States":"États-Unis","Canada":"Canada","United Kingdom":"Royaume-Uni",
 "Netherlands":"Pays-Bas","Germany":"Allemagne","France":"France","Spain":"Espagne","Italy":"Italie","Portugal":"Portugal",
 "Greece":"Grèce","Austria":"Autriche","Switzerland":"Suisse","Belgium":"Belgique","Poland":"Pologne","Czech Republic":"Tchéquie",
 "Hungary":"Hongrie","Romania":"Roumanie","Bulgaria":"Bulgarie","Croatia":"Croatie","Slovakia":"Slovaquie","Slovenia":"Slovénie",
 "Sweden":"Suède","Norway":"Norvège","Denmark":"Danemark","Finland":"Finlande","Ireland":"Irlande","Estonia":"Estonie",
 "Latvia":"Lettonie","Lithuania":"Lituanie","Georgia":"Géorgie","Armenia":"Arménie","Azerbaijan":"Azerbaïdjan","Ukraine":"Ukraine",
 "Moldova":"Moldavie","Serbia":"Serbie","Bosnia and Herzegovina":"Bosnie-Herzégovine","Albania":"Albanie","North Macedonia":"Macédoine du Nord",
 "Montenegro":"Monténégro","Kosovo":"Kosovo","Japan":"Japon","Korea, Republic of":"Corée du Sud","Malaysia":"Malaisie","Singapore":"Singapour",
 "Israel":"Israël","Iran, Islamic Republic of":"Iran","Iraq":"Irak","Saudi Arabia":"Arabie saoudite","Yemen":"Yémen","Syrian Arab Republic":"Syrie",
 "Kyrgyzstan":"Kirghizistan","Tajikistan":"Tadjikistan","Uzbekistan":"Ouzbékistan","Kazakhstan":"Kazakhstan","Afghanistan":"Afghanistan",
 "Mongolia":"Mongolie","Bhutan":"Bhoutan","Maldives":"Maldives","Eswatini":"Eswatini","Lesotho":"Lesotho","Botswana":"Botswana",
 "Namibia":"Namibie","Angola":"Angola","Gabon":"Gabon","Chad":"Tchad","Niger":"Niger","Sudan":"Soudan","South Sudan":"Soudan du Sud",
 "Somalia":"Somalie","Eritrea":"Érythrée","Djibouti":"Djibouti","Mauritania":"Mauritanie","Gambia":"Gambie","Guinea-Bissau":"Guinée-Bissau",
 "Cape Verde":"Cap-Vert","Sao Tome and Principe":"Sao Tomé-et-Principe","Central African Republic":"Centrafrique","Seychelles":"Seychelles",
 "Trinidad and Tobago":"Trinité-et-Tobago","Barbados":"Barbade","Grenada":"Grenade","Saint Lucia":"Sainte-Lucie","Dominica":"Dominique",
 "Belize":"Belize","Suriname":"Suriname","Puerto Rico":"Porto Rico","France":"France","Réunion":"La Réunion","New Caledonia":"Nouvelle-Calédonie",
 "French Polynesia":"Polynésie française","Martinique":"Martinique","Guadeloupe":"Guadeloupe"}

CONTINENT={"Africa":"Afrique","Latin America and the Caribbean":"Amérique latine & Caraïbes","Northern America":"Amérique du Nord",
 "Asia":"Asie","Europe":"Europe","Oceania":"Océanie","Middle East":"Moyen-Orient"}

PROD_FR={"Coffee":"Café","Cocoa":"Cacao","Tea":"Thé","Honey":"Miel","Sugar":"Sucre","Bananas":"Bananes","Fresh fruit":"Fruits frais",
 "Fruit":"Fruits","Vegetables":"Légumes","Herbs and spices":"Herbes & épices","Spices":"Épices","Nuts":"Fruits à coque","Wine":"Vin",
 "Flowers":"Fleurs","Cotton":"Coton","Rice":"Riz","Quinoa":"Quinoa","Oil seeds":"Oléagineux","Citrus":"Agrumes","Grapes":"Raisins",
 "Dried fruit":"Fruits secs","Avocado":"Avocat","Mango":"Mangue","Pineapple":"Ananas","Coconut":"Noix de coco","Olive oil":"Huile d'olive",
 "Juice":"Jus","Cereals":"Céréales","Pulses":"Légumineuses","Shea butter":"Beurre de karité","Vanilla":"Vanille","Sesame":"Sésame",
 "Cashew":"Noix de cajou","Composite":"Produits composés","(Not Specified)":"Non précisé","Dairy":"Produits laitiers","Eggs":"Œufs",
 "Meat":"Viande","Fish":"Poisson","Timber":"Bois","Gold":"Or","Textiles":"Textiles","Beans":"Haricots","Maize":"Maïs","Soya":"Soja",
 "Groundnuts":"Arachides","Yams":"Ignames","Cassava":"Manioc","Rubber":"Caoutchouc","Palmito":"Cœurs de palmier","Beer":"Bière",
 "Spirulina":"Spiruline","Roses":"Roses","Grains":"Grains","Seeds":"Semences"}

PROD_FR.update({"Banana":"Banane","Flowers and Plants":"Fleurs & plantes","Cane sugar":"Sucre de canne",
 "Herbs, herbal teas & spices":"Herbes, infusions & épices","Wine grapes":"Raisin de cuve","Paddy":"Riz paddy",
 "Oilseeds and Oleaginous fruit":"Oléagineux & fruits oléagineux","Mango":"Mangue","Potato":"Pomme de terre",
 "Vegetable":"Légumes","Growing of crops; market gardening; horticulture":"Grandes cultures, maraîchage & horticulture",
 "Agricultural Commodities":"Produits agricoles divers","Seedless Raisins":"Raisins secs","Cashew nut":"Noix de cajou",
 "Shea nuts":"Noix de karité","Olives":"Olives","Olive":"Olive","Cocoa butter":"Beurre de cacao","Tea (black)":"Thé noir",
 "Tea (green)":"Thé vert","Robusta coffee":"Café robusta","Arabica coffee":"Café arabica","Fresh Vegetables":"Légumes frais",
 "Grapes":"Raisins","Pulses and Legumes":"Légumineuses","Cotton seed":"Graines de coton","Sugar cane":"Canne à sucre",
 "Cardamom":"Cardamome","Pepper":"Poivre","Ginger":"Gingembre","Turmeric":"Curcuma","Cinnamon":"Cannelle","Vanilla beans":"Gousses de vanille",
 "Coconut oil":"Huile de coco","Palm oil":"Huile de palme","Sesame seed":"Graines de sésame","Soy bean":"Soja",
 "Ground nut":"Arachide","Sunflower":"Tournesol","Maize (white)":"Maïs blanc","Wheat":"Blé","Barley":"Orge",
 "Fresh Fruit and Vegetables":"Fruits & légumes frais","Processed Fruit":"Fruits transformés","Dried Fruit":"Fruits séchés",
 "Bananas (fresh)":"Bananes fraîches","Pineapple":"Ananas","Papaya":"Papaye","Avocados":"Avocats","Lemons":"Citrons",
 "Oranges":"Oranges","Grapefruit":"Pamplemousses","Apples":"Pommes","Pears":"Poires","Table grapes":"Raisin de table",
 "Strawberries":"Fraises","Melons":"Melons","Watermelons":"Pastèques","Tomatoes":"Tomates","Onions":"Oignons",
 "Carrots":"Carottes","Cabbages":"Choux","Cauliflower":"Chou-fleur","Brinjal":"Aubergine","Okra":"Gombo",
 "Sweet potato":"Patate douce","Cassava flour":"Farine de manioc","Honey and bee products":"Miel & produits de la ruche",
 "Beeswax":"Cire d'abeille","Propolis":"Propolis","Royal Jelly":"Gelée royale","Shea":"Karité","Argan":"Argan",
 "Aloe vera":"Aloé vera","Essential oils":"Huiles essentielles","Medicinal plants":"Plantes médicinales",
 "Aromatic plants":"Plantes aromatiques","Wild collected products":"Produits de cueillette sauvage"})

def fr_country(c):
    c=(c or "").strip()
    return FR.get(c, c)

def fr_products(lst):
    out=[]
    for p in lst or []:
        out.append(PROD_FR.get(p.strip(), p.strip()))
    return ", ".join(out) if out else "Non trouvé"

def city_from_address(addr, country):
    if not addr: return ""
    import unicodedata
    def nz(s):
        s=unicodedata.normalize("NFKD",s or "")
        return "".join(c for c in s if not unicodedata.combining(c)).lower().strip()
    a=addr.strip().rstrip(",")
    parts=[p.strip() for p in re.split(r',', a) if p.strip()]
    ctry=nz(country)
    out=""
    for cand in reversed(parts):
        c=nz(cand)
        if not c or len(c)<3: continue
        if c==ctry or c in ctry or ctry in c: continue
        if re.fullmatch(r'[\d\s\-\.]+', cand): continue
        if re.search(r'\b(pin|zip|postal)\b', c): continue
        if len(cand)>60: continue
        out=re.sub(r'\b(BP|PO Box|P\.O\. Box|Boite Postale|Apdo|Apartado|Casilla|P\.?O\.?\s?Box)\b.*$','',cand,flags=re.I).strip(' -,')
        break
    return out

rows=[]
def add(**kw):
    r={c:"" for c in COLS}
    r.update(kw)
    rows.append(r)

# ---------------- 1. Fairtrade (FLOCERT / Fairtrade Finder) ----------------
ft=json.load(open('ft_producers.json'))
for x in ft:
    name=x["op_name"].strip()
    alt=(x.get("op_altname") or "").strip()
    if alt and alt.lower() not in name.lower(): name=f"{name} ({alt})"
    country=fr_country(x["op_country"])
    std=x.get("cert_standard",[])
    if any("Small Producer" in s for s in std): typ="Coopérative / organisation de petits producteurs"
    elif any("Hired Labour" in s for s in std): typ="Plantation / exploitation (main-d'œuvre salariée)"
    else: typ="Organisation de producteurs"
    prod=fr_products(x.get("cert_product",[]))
    certs=["Fairtrade (FLOCERT)"]+ [p for p in x.get("cert_standard",[]) if p and "Producer" in p]
    add(**{"Nom du producteur":name,"Pays":country,"Continent":CONTINENT.get(x.get("op_region"),x.get("op_region","")),
        "Région / Ville":city_from_address(x.get("op_address",""), x["op_country"].strip()),
        "Type de producteur":typ,"Produits principaux":prod,"Bio":"À vérifier","Équitable":"Oui",
        "Certification":"Fairtrade International / FLOCERT — "+(" ; ".join(std)),"Adresse":x.get("op_address",""),
        "Site internet":"Non trouvé","Email":"Non trouvé","Téléphone":"Non trouvé","WhatsApp":"Non trouvé",
        "LinkedIn":"Non trouvé","Instagram":"Non trouvé","Facebook":"Non trouvé","Contact / Responsable":"Non trouvé",
        "Source":"Fairtrade Finder / FLOCERT (API officielle assurance-ix) — https://www.fairtrade.net/en/fairtrade-finder.html",
        "Notes":f"FLO-ID {x.get('op_floId')} — statut certification : {x.get('cert_status')} — organisme : {x.get('cert_body')}"})

# ---------------- 2. WFTO ----------------
if os.path.exists('wfto_meta.json') and os.path.exists('wfto_scrape.json'):
    meta=json.load(open('wfto_meta.json')); sc=json.load(open('wfto_scrape.json'))
    by={m["link"]:m for m in meta}
    CATKEYS=["food-and-beverages","fashion-categories","home-decor-categories","beauty-and-wellness-categories",
             "stationery-categories","kids-baby-and-maternity-category","product-categories-fashion","materials-and-components","member-categories"]
    for link,v in sc.items():
        if v.get("err"): continue
        m=by.get(link,{})
        title=(m.get("title") or {}).get("rendered","")
        cats=[]
        for k in CATKEYS:
            for c in m.get(k) or []:
                if isinstance(c,dict): cats.append(c.get("name") or c.get("slug") or "")
                else: cats.append(str(c))
        cats=[c for c in dict.fromkeys(cats) if c]
        lines=v.get("lines",[])
        def after(label):
            for i,l in enumerate(lines):
                if l.strip().lower()==label.lower():
                    return lines[i-1].strip() if i>0 else ""
            return ""
        mobile=after("Mobile"); land=after("Landline Number"); site=after("Main Website")
        wa=v.get("wa","")
        wnum=""
        if wa:
            mm=re.search(r'wa\.me/(\+?\d+)',wa)
            if mm: wnum="+"+mm.group(1).lstrip("+")
        emails=v.get("emails",[])
        ext=[u for u in v.get("ext",[]) if not re.search(r'(cookiedatabase|privacy-center|helix|adobe)',u)]
        siteu=site if site.startswith("http") else (ext[0] if ext else "")
        # country/city from lines
        country=""; city=""
        for i,l in enumerate(lines):
            if l.strip()=="Country" and i>0: country=lines[i-1].strip()
            if l.strip()=="City" and i>0: city=lines[i-1].strip()
        add(**{"Nom du producteur":title,"Pays":fr_country(country),"Région / Ville":city,
            "Type de producteur":"Entreprise de commerce équitable (membre WFTO) — producteur/artisan",
            "Produits principaux":", ".join(cats) if cats else "Non trouvé","Bio":"À vérifier","Équitable":"Oui",
            "Certification":"WFTO Verified / Fair Trade Organisation",
            "Site internet":siteu or "Non trouvé","Email":(emails[0] if emails else "Non trouvé"),
            "Téléphone":(mobile or land or "Non trouvé"),
            "WhatsApp":(wnum or wa or "Non trouvé"),
            "LinkedIn":v.get("soc",{}).get("linkedin","Non trouvé") or "Non trouvé",
            "Instagram":v.get("soc",{}).get("instagram","Non trouvé") or "Non trouvé",
            "Facebook":v.get("soc",{}).get("facebook","Non trouvé") or "Non trouvé",
            "Contact / Responsable":"Non trouvé",
            "Source":f"Profil membre WFTO — {link}",
            "Notes":"Emails trouvés : "+", ".join(emails[1:4]) if len(emails)>1 else ""})

# ---------------- 3. Colombie — annuaire Clima y Café ----------------
if os.path.exists('raw/climaycafe.json'):
    for r in json.load(open('raw/climaycafe.json')):
        name=r["name"]
        if r.get("acr") and r["acr"] not in name: name=f"{name} ({r['acr']})"
        loc=", ".join([x for x in [r.get("muni"),r.get("dept")] if x])
        add(**{"Nom du producteur":name,"Pays":"Colombie","Continent":"Amérique latine & Caraïbes","Région / Ville":loc,
            "Type de producteur":"Coopérative de caficulteurs","Produits principaux":"Café",
            "Bio":"À vérifier","Équitable":"À vérifier","Certification":"Non trouvé",
            "Site internet":(r["web"][0] if r.get("web") else "Non trouvé"),
            "Email":(r["emails"][0] if r.get("emails") else "Non trouvé"),
            "Téléphone":("+57 "+r["tel"] if r.get("tel") else "Non trouvé"),
            "WhatsApp":"Non trouvé","LinkedIn":"Non trouvé","Instagram":"Non trouvé","Facebook":"Non trouvé",
            "Contact / Responsable":(r.get("rep") or "Non trouvé"),"Adresse":r.get("addr",""),
            "Source":"Annuaire des coopératives cafetières de Colombie — https://climaycafe.com/cooperativas/",
            "Notes":("Autres emails : "+", ".join(r["emails"][1:4])) if len(r.get("emails",[]))>1 else ""})

# ---------------- 3b. Colombie — associations de producteurs (Clima y Café) ----------------
if os.path.exists('raw/climaycafe_asoc.json'):
    for r in json.load(open('raw/climaycafe_asoc.json')):
        name=r["name"]
        if r.get("acr") and r["acr"] not in name: name=f"{name} ({r['acr']})"
        loc=", ".join([x for x in [r.get("muni"),r.get("dept")] if x])
        add(**{"Nom du producteur":name,"Pays":"Colombie","Continent":"Amérique latine & Caraïbes","Région / Ville":loc,
            "Type de producteur":"Association de producteurs de café","Produits principaux":"Café",
            "Bio":"À vérifier","Équitable":"À vérifier","Certification":"Non trouvé",
            "Site internet":(r["web"][0] if r.get("web") else "Non trouvé"),
            "Email":(r["emails"][0] if r.get("emails") else "Non trouvé"),
            "Téléphone":("+57 "+r["tel"] if r.get("tel") else "Non trouvé"),
            "WhatsApp":"Non trouvé","LinkedIn":"Non trouvé","Instagram":"Non trouvé","Facebook":"Non trouvé",
            "Contact / Responsable":(r.get("rep") or "Non trouvé"),"Adresse":r.get("addr",""),
            "Source":"Annuaire des associations de producteurs de café de Colombie — https://climaycafe.com/asociaciones/",
            "Notes":("Autres emails : "+", ".join(r["emails"][1:4])) if len(r.get("emails",[]))>1 else ""})

# ---------------- 4. Pérou — PromPerú ----------------
if os.path.exists('raw/promperu.json'):
    for r in json.load(open('raw/promperu.json')):
        addr=", ".join([x for x in [r.get("addr1"),r.get("addr2")] if x and x.strip()])
        add(**{"Nom du producteur":r["name"],"Pays":"Pérou","Continent":"Amérique latine & Caraïbes",
            "Région / Ville":(addr.split(",")[-1].strip() if addr else ""),
            "Type de producteur":"Producteur / exportateur de produits bio",
            "Produits principaux":(r.get("products") or "Non trouvé"),"Bio":"Oui","Équitable":"À vérifier",
            "Certification":"Agriculture biologique (opérateur bio Pérou)",
            "Site internet":(r["web"][0] if r.get("web") else "Non trouvé"),
            "Email":(r["emails"][0] if r.get("emails") else "Non trouvé"),
            "Téléphone":(r.get("tel") or "Non trouvé"),"WhatsApp":"Non trouvé","LinkedIn":"Non trouvé",
            "Instagram":"Non trouvé","Facebook":"Non trouvé",
            "Contact / Responsable":(r.get("contact") or "Non trouvé"),"Adresse":addr,
            "Source":"PromPerú — Directorio de Productores y Exportadores de Productos Orgánicos del Perú",
            "Notes":("Autres emails : "+", ".join(r["emails"][1:3])) if len(r.get("emails",[]))>1 else ""})


# ---------------- 5. Inde — Farmer Producer Companies (NSTIAM / NABARD) ----------------
if os.path.exists('raw/nstiam.json'):
    for r in json.load(open('raw/nstiam.json')):
        contact=r.get("contact","")
        person=re.sub(r'\s*[-\d+\s]{6,}$','',contact).strip()
        person=re.sub(r'\s*(Director|Secretary|Chairman|CEO|MD|President|Member|Manager)\s*\d*$','',person).strip()
        add(**{"Nom du producteur":r["name"],"Pays":"Inde","Continent":"Asie",
            "Région / Ville":(re.sub(r"\s*\d{6}.*$","",r.get("addr","").split(",")[-1].strip()) if r.get("addr") else ""),
            "Type de producteur":"Farmer Producer Company (société de producteurs agricoles)",
            "Produits principaux":(r.get("products") or "Non trouvé"),"Bio":"À vérifier","Équitable":"À vérifier",
            "Certification":"Non trouvé","Site internet":(r.get("web") or "Non trouvé"),
            "Email":(r["emails"][0] if r.get("emails") else "Non trouvé"),
            "Téléphone":("+91 "+r["tel"] if r.get("tel") else "Non trouvé"),
            "WhatsApp":"Non trouvé","LinkedIn":"Non trouvé","Instagram":"Non trouvé","Facebook":"Non trouvé",
            "Contact / Responsable":(person or "Non trouvé"),"Adresse":r.get("addr",""),
            "Source":"Directory of Farmer Producer Companies & FPO — NSTIAM / NABARD (PDF officiel)",
            "Notes":("Membres : "+r["members"] if r.get("members") else "")})

# ---------------- 6. Inde — FPO épices (Spices Board) ----------------
if os.path.exists('raw/spices_fpo.json'):
    for r in json.load(open('raw/spices_fpo.json')):
        add(**{"Nom du producteur":r["name"],"Pays":"Inde","Continent":"Asie","Région / Ville":r.get("state",""),
            "Type de producteur":"Organisation de producteurs (FPO/FPC) — épices",
            "Produits principaux":(r.get("products") or "Épices"),"Bio":"À vérifier","Équitable":"À vérifier",
            "Certification":"Non trouvé","Site internet":"Non trouvé",
            "Email":(r["emails"][0] if r.get("emails") else "Non trouvé"),
            "Téléphone":("+91 "+r["tel"] if r.get("tel") else "Non trouvé"),
            "WhatsApp":"Non trouvé","LinkedIn":"Non trouvé","Instagram":"Non trouvé","Facebook":"Non trouvé",
            "Contact / Responsable":"Non trouvé","Adresse":r.get("state",""),
            "Source":"Spices Board India — State wise FPO/FPC details (PDF officiel)",
            "Notes":("Autres emails : "+", ".join(r["emails"][1:3])) if len(r.get("emails",[]))>1 else ""})

# ---------------- 7. Inde — exportateurs bio (TNAU) ----------------
if os.path.exists('raw/tnau.json'):
    for r in json.load(open('raw/tnau.json')):
        add(**{"Nom du producteur":r["name"],"Pays":"Inde","Continent":"Asie","Région / Ville":r.get("state",""),
            "Type de producteur":"Producteur / exportateur bio (plantation ou entreprise de transformation)",
            "Produits principaux":(r.get("products") or "Produits bio"),"Bio":"Oui","Équitable":"À vérifier",
            "Certification":"Agriculture biologique (NPOP / export)","Site internet":"Non trouvé",
            "Email":(r["emails"][0] if r.get("emails") else "Non trouvé"),
            "Téléphone":("+91 "+r["tel"] if r.get("tel") else "Non trouvé"),
            "WhatsApp":"Non trouvé","LinkedIn":"Non trouvé","Instagram":"Non trouvé","Facebook":"Non trouvé",
            "Contact / Responsable":"Non trouvé","Adresse":re.sub(r'\s*EMAIL:.*$','',r.get("addr","")),
            "Source":"TNAU Agritech — Organic Farming : Organic Exporters (Inde)",
            "Notes":""})

# ---------------- 8. Maroc — argan / huile (Maroc Annuaire) ----------------
if os.path.exists('raw/maroc_argan.json'):
    for r in json.load(open('raw/maroc_argan.json')):
        web=r.get("web","")
        if web and re.search(r'(gmail|yahoo|hotmail|outlook|menara|live|marocannuaire)', web, re.I): web=""
        add(**{"Nom du producteur":r["name"],"Pays":"Maroc","Continent":"Afrique","Région / Ville":r.get("city",""),
            "Type de producteur":("Coopérative / producteur d'huile d'argan" if re.search(r'(coop|cooperative|coopérative|union|gie|associat)',r["name"],re.I) else "Producteur / fabricant d'huile d'argan"),
            "Produits principaux":"Huile d'argan, produits cosmétiques naturels","Bio":"À vérifier","Équitable":"À vérifier",
            "Certification":"Non trouvé","Site internet":(web or "Non trouvé"),
            "Email":(r["emails"][0] if r.get("emails") else "Non trouvé"),
            "Téléphone":("+212 "+r["tel"].lstrip("0") if r.get("tel") and not r["tel"].startswith("+") else (r.get("tel") or "Non trouvé")),
            "WhatsApp":"Non trouvé","LinkedIn":"Non trouvé","Instagram":"Non trouvé","Facebook":"Non trouvé",
            "Contact / Responsable":"Non trouvé","Adresse":r.get("addr",""),
            "Source":"Maroc Annuaire — catégorie Huile d'argane (https://www.marocannuaire.org)",
            "Notes":""})

# ---------------- 9. Maroc — huilerie / olives (Conseil oléicole international) ----------------
if os.path.exists('raw/ioc_morocco.json'):
    for r in json.load(open('raw/ioc_morocco.json')):
        typ="Coopérative agricole / union de coopératives" if re.search(r'(coop|cooperative|coopérative|gie|union|association)',r["name"],re.I) else "Huilerie / moulin / industriel de l'huile d'olive"
        add(**{"Nom du producteur":r["name"],"Pays":"Maroc","Continent":"Afrique",
            "Région / Ville":(r["addr"].split("-")[-1].strip() if "-" in r.get("addr","") else ""),
            "Type de producteur":typ,"Produits principaux":"Huile d'olive, huile de grignons d'olive",
            "Bio":"À vérifier","Équitable":"À vérifier","Certification":"Non trouvé","Site internet":"Non trouvé",
            "Email":(r["emails"][0] if r.get("emails") else "Non trouvé"),
            "Téléphone":("+212 "+r["tel"].replace("0",".",0) if r.get("tel") and not r["tel"].startswith("+") else (r.get("tel") or "Non trouvé")),
            "WhatsApp":"Non trouvé","LinkedIn":"Non trouvé","Instagram":"Non trouvé","Facebook":"Non trouvé",
            "Contact / Responsable":"Non trouvé","Adresse":r.get("addr",""),
            "Source":"Conseil oléicole international — Liste des exportateurs/importateurs d'huiles d'olive, Maroc",
            "Notes":("Autres emails : "+", ".join(r["emails"][1:3])) if len(r.get("emails",[]))>1 else ""})


# ---------- 11. Côte d'Ivoire — coopératives cacao/café agréées (Conseil Café-Cacao) ----------
if os.path.exists('raw/ci_coops.json'):
    for r in json.load(open('raw/ci_coops.json', encoding='utf-8')):
        name=(r.get("name") or "").strip()
        if not name: continue
        tels=[t.strip() for t in re.split(r"[/,]", r.get("tel") or "") if t.strip()]
        tel=" / ".join("+225 "+t for t in tels) if tels else ""
        note="Registre officiel des coopératives agréées (campagne 2013-2014) : numéros au format 8 chiffres d'avant 2021, à revalider."
        if r.get("bp"): note += " Boîte postale : "+r["bp"]+"."
        add(**{"Nom du producteur":name,"Pays":"Côte d'Ivoire","Continent":"Afrique",
            "Région / Ville":(r.get("loc") or "").strip(),"Type de producteur":"Coopérative de producteurs de cacao-café",
            "Produits principaux":"Cacao, café","Bio":"À vérifier","Équitable":"À vérifier","Certification":"Non trouvé",
            "Site internet":"Non trouvé","Email":"Non trouvé","Téléphone":(tel or "Non trouvé"),
            "WhatsApp":"Non trouvé","LinkedIn":"Non trouvé","Instagram":"Non trouvé","Facebook":"Non trouvé",
            "Contact / Responsable":"Non trouvé","Adresse":((r.get("loc") or "")+((" — "+r["bp"]) if r.get("bp") else "")),
            "Source":"Conseil Café-Cacao — Liste des coopératives agréées (conseilcafecacao.ci)",
            "Notes":note})
    print("ci_coops:", len(json.load(open('raw/ci_coops.json', encoding='utf-8'))))

# ---------------- 12. Europe & OCDE — producteurs bio vérifiés (sites officiels, Biocoop groupements, IFOAM, guides régionaux) ----------------
import importlib.util as _ilu
if os.path.exists('raw/europe_producers.py'):
    _spec=_ilu.spec_from_file_location("eu","raw/europe_producers.py"); _m=_ilu.module_from_spec(_spec); _spec.loader.exec_module(_m)
    _EU_CONT={"France":"Europe","Grèce":"Europe","Espagne":"Europe","Italie":"Europe","Portugal":"Europe","Finlande":"Europe",
              "Suisse":"Europe","Autriche":"Europe","Croatie":"Europe","Tchéquie":"Europe","États-Unis":"Amérique du Nord",
              "Australie":"Océanie","Philippines":"Asie","Argentine":"Amérique latine & Caraïbes"}
    _n=0
    for e in _m.E:
        (nom,pays,region,typ,prod,bio,equ,certif,site,email,tel,wapp,li,ig,fb,contact,adresse,source,notes)=e[:19]
        if len(e)>19: notes=(notes+" "+" ".join(str(x) for x in e[19:])).strip()
        add(**{"Nom du producteur":nom,"Pays":pays,"Continent":"","Région / Ville":region,
            "Type de producteur":typ,"Produits principaux":prod,"Bio":bio,"Équitable":equ,"Certification":certif,
            "Site internet":site,"Email":email,"Téléphone":tel,"WhatsApp":wapp,"LinkedIn":li,"Instagram":ig,
            "Facebook":fb,"Contact / Responsable":contact,"Adresse":adresse,"Source":source,"Notes":notes,
            "Continent":_EU_CONT.get(pays,"Europe")})
        _n+=1
    print("europe_producers:", _n)

# ---------------- Nettoyage : fiches inexploitables (pas de pays) ----------------
_bad_names=re.compile(r'^(wfto|world fair trade|fairtrade|test|n/?a|unknown|untitled)\b', re.I)
_before=len(rows)
rows=[r for r in rows if (r.get("Pays") or "").strip() not in ("","Non précisé") or not _bad_names.search(r.get("Nom du producteur","").strip())]
print("fiches supprimées (sans pays + nom invalide):", _before-len(rows))

# ---------------- Déduplication & fusion des fiches ----------------
import unicodedata
SUFFIX=re.compile(r'\b(ltd|ltda|limited|sa|sarl|sas|sac|srl|eirl|sco|coop|coop-?ca|cooperative|cooperativa|co-op|company|co|inc|llc|gmbh|plc|pvt|private|the|de|del|la|le|les|y|et|and|of|society|societe|association|asociacion|union|federacion|federation|group|groupement|enterprise|enterprises|spc|fcs|fpc|fpo|l|n|n\d+|ndeg)\b', re.I)
def nkey(name):
    n=unicodedata.normalize("NFKD",name or "")
    n="".join(c for c in n if not unicodedata.combining(c)).lower()
    n=re.sub(r'\(.*?\)',' ',n)
    n=re.sub(r'[^a-z0-9]+',' ',n)
    n=" ".join(w for w in n.split() if w not in SUFFIX.pattern and len(w)>1)
    n=SUFFIX.sub(' ',n)
    n=re.sub(r'\s+',' ',n).strip()
    return n
groups={}
for r in rows:
    k=(nkey(r["Nom du producteur"]), (r["Pays"] or "").strip().lower())
    if not k[0] or k[1] in ("","non trouvé","non précisé"):
        k=(r["Nom du producteur"].lower()+"|"+str(id(r)), k[1])
    groups.setdefault(k,[]).append(r)
merged=[]
PRIORITY=["Site internet","Email","Téléphone","WhatsApp","LinkedIn","Instagram","Facebook","Contact / Responsable","Adresse","Région / Ville","Certification"]
for k,g in groups.items():
    if len(g)==1: merged.append(g[0]); continue
    g.sort(key=lambda r: sum(1 for f in PRIORITY if r[f] not in ("Non trouvé","","À vérifier")), reverse=True)
    base=g[0]
    for other in g[1:]:
        for f in PRIORITY:
            if base[f] in ("Non trouvé","","À vérifier") and other[f] not in ("Non trouvé","","À vérifier"):
                base[f]=other[f]
        if other["Produits principaux"] not in ("Non trouvé","") and other["Produits principaux"] not in base["Produits principaux"]:
            base["Produits principaux"]=(base["Produits principaux"]+", "+other["Produits principaux"]).strip(", ")
        if base["Bio"]=="À vérifier" and other["Bio"]=="Oui": base["Bio"]="Oui"
        if base["Équitable"]=="À vérifier" and other["Équitable"]=="Oui": base["Équitable"]="Oui"
        base["Source"]=base["Source"]+" ; "+other["Source"]
        if other["Notes"] and other["Notes"] not in base["Notes"]:
            base["Notes"]=(base["Notes"]+" | "+other["Notes"]).strip(" |")
    base["_dup"]=len(g)
    merged.append(base)
rows=merged
for r in rows:
    if not r.get("Pays") or r["Pays"] in ("Non trouvé",""): r["Pays"]="Non précisé"
    if not r.get("Continent") or r["Continent"] in ("Non trouvé",""): r["Continent"]="Non précisé"

# ---------------- IDs & export ----------------
for i,r in enumerate(rows,1):
    r["ID"]=f"ETH-{i:05d}"
    for c in COLS:
        if r.get(c) in (None,""): r[c]="Non trouvé"
with open("base_producteurs_ethimarket.csv","w",newline="",encoding="utf-8-sig") as f:
    w=csv.DictWriter(f,fieldnames=COLS); w.writeheader()
    for r in rows: w.writerow({c:r[c] for c in COLS})
print("TOTAL rows:",len(rows))
from collections import Counter
print("pays:",len(set(r["Pays"] for r in rows)))
for k in ("Site internet","Email","Téléphone","WhatsApp","LinkedIn","Instagram","Facebook","Contact / Responsable"):
    print(f"  avec {k}: {sum(1 for r in rows if r[k] not in ('Non trouvé','','À vérifier'))}")
json.dump(rows, open("rows.json","w"), ensure_ascii=False)
