import requests
from bs4 import BeautifulSoup

# URL du site local
url = 'http://localhost/scraping_exam/inggbaabrief3/index.html'

# Faire la requête
response = requests.get(url)

# Vérifier si ça a marché
if response.status_code == 200:
    # Parser le HTML
    soup = BeautifulSoup(response.text, 'html.parser')
    
    donnees = {}
    
    #EXTRAIRE LES TITRES
    titres = []
    for titre in soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']):
        titres.append(titre.text.strip())
    donnees['titres'] = titres
    
    #EXTRAIRE LES PARAGRAPHES
    paragraphes = []
    for p in soup.find_all('p'):
        texte = p.text.strip()
        if texte:  # Éviter les paragraphes vides
            paragraphes.append(texte)
    donnees['paragraphes'] = paragraphes
    
    # EXTRAIRE LES IMAGES 
    images = []
    for img in soup.find_all('img'):
        images.append({
            'src': img.get('src', ''),
            'alt': img.get('alt', ''),
            'width': img.get('width', ''),
            'height': img.get('height', '')
        })
    donnees['images'] = images
    
    # EXTRAIRE LES LIENS
    liens = []
    for a in soup.find_all('a', href=True):
        liens.append({
            'texte': a.text.strip(),
            'href': a.get('href', ''),
            'title': a.get('title', '')
        })
    donnees['liens'] = liens
    
    #EXTRAIRE LES FORMULAIRES
    formulaires = []
    for form in soup.find_all('form'):
        formulaire_data = {
            'methode': form.get('method', 'GET').upper(),
            'action': form.get('action', ''),
            'champs': []
        }
        
        # Extraire les champs du formulaire
        for input_field in form.find_all(['input', 'textarea', 'select']):
            champ = {
                'type': input_field.name,
                'input_type': input_field.get('type', ''),
                'id': input_field.get('id', ''),
                'name': input_field.get('name', ''),
                'placeholder': input_field.get('placeholder', ''),
                'required': input_field.has_attr('required')
            }
            formulaire_data['champs'].append(champ)
        
        # Extraire les boutons du formulaire
        for button in form.find_all('button'):
            formulaire_data['champs'].append({
                'type': 'button',
                'input_type': button.get('type', 'button'),
                'texte': button.text.strip()
            })
        
        formulaires.append(formulaire_data)
    donnees['formulaires'] = formulaires
    
    #AFFICHER LES RÉSULTATS
    print("\n" + "="*50)
    print("RÉSULTATS DU SCRAPING")
    print("="*50 + "\n")
    
    print("TITRES")
    for titre in donnees['titres']:
        print(f"  • {titre}")
    
    print("\nPARAGRAPHES")
    for para in donnees['paragraphes']:
        print(f"  • {para}")
    
    print("\nIMAGES")
    for img in donnees['images']:
        print(f"  • {img['src']}")
    
    print("\nLIENS")
    for lien in donnees['liens']:
        print(f"  • {lien['texte']}")
    
    print("\nFORMULAIRES")
    for i, form in enumerate(donnees['formulaires'], 1):
        print(f"  Formulaire {i}:")
        for champ in form['champs']:
            nom = champ.get('name') or champ.get('id') or champ.get('texte', 'champ')
            print(f"    - {nom}")
else:
    print(f"Erreur lors de la requête : {response.status_code}")
    