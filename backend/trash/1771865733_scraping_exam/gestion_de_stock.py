# Application de gestion de stock

stock = {}

def ajouter_produit():
    nom = input("Nom du produit : ")
    quantite = int(input("Quantité : "))
    stock[nom] = quantite
    print(f"{nom} ajouté avec {quantite} unités.")

def afficher_stock():
    if not stock:
        print("Stock vide.")
    else:
        print("stock actuel :")
        for produit, quantite in stock.items():
            print(f"{produit} : {quantite}")

def vendre_produit():
    nom = input("Nom du produit à vendre : ")

    if nom in stock:
        qte = int(input("Quantité à vendre : "))

        if qte <= stock[nom]:
            stock[nom] -= qte
            print(f"{qte} unités de {nom} vendues.")

            if stock[nom] == 0:
                print(f"⚠ {nom} est en rupture de stock.")
        else:
            print("Quantité insuffisante.")
    else:
        print("Produit inexistant.")

def menu():
    print("""
1. Ajouter un produit
2. Afficher le stock
3. Vendre un produit
4. Quitter
""")

# Programme principal
while True:
    menu()
    choix = input("Votre choix : ")

    if choix == "1":
        ajouter_produit()
    elif choix == "2":
        afficher_stock()
    elif choix == "3":
        vendre_produit()
    elif choix == "4":
        print("Au revoir")
        break
    else:
        print("Choix invalide.")