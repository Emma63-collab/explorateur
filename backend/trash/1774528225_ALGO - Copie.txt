DEBUT

    Déclarer tableau Produits[10]
    Déclarer tableau Stock[10]
    Déclarer nbProduits ← 0
    Déclarer choix

    TANT QUE choix ≠ 5 FAIRE

        Afficher "1. Ajouter un produit"
        Afficher "2. Entrée en stock"
        Afficher "3. Sortie de stock"
        Afficher "4. Afficher le stock"
        Afficher "5. Quitter"

        Lire choix

        SI choix = 1 ALORS
            Lire nomProduit
            Produits[nbProduits] ← nomProduit
            Stock[nbProduits] ← 0
            nbProduits ← nbProduits + 1

        SINON SI choix = 2 ALORS
            Lire indexProduit
            Lire quantite
            Stock[indexProduit] ← Stock[indexProduit] + quantite

        SINON SI choix = 3 ALORS
            Lire indexProduit
            Lire quantite
            SI Stock[indexProduit] ≥ quantite ALORS
                Stock[indexProduit] ← Stock[indexProduit] - quantite
            SINON
                Afficher "Stock insuffisant"
            FIN SI

        SINON SI choix = 4 ALORS
            POUR i de 0 à nbProduits - 1 FAIRE
                Afficher Produits[i], Stock[i]
            FIN POUR

        FIN SI

    FIN TANT QUE

FIN