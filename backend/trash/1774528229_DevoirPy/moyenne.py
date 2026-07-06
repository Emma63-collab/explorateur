etudiants = []

for i in range(10):
    print("\nÉtudiant", i + 1)
    
    nom = input("Nom : ")
    prenom = input("Prénom : ")
    
    total = 0
    for j in range(9):
        note = float(input("Note : "))
        total = total + note
    
    moyenne = total / 9
    
    if moyenne < 10:
        mention = "Ajourné"
    elif moyenne < 12:
        mention = "Passable"
    elif moyenne < 14:
        mention = "Assez bien"
    elif moyenne < 17:
        mention = "Bien"
    elif moyenne < 20:
        mention = "Très bien"
    else:
        mention = "Excellent"
    
    etudiants.append([nom, prenom, moyenne, mention])

# Recherche de la meilleure et de la plus faible moyenne
meilleure = etudiants[0]
faible = etudiants[0]

for e in etudiants:
    if e[2] > meilleure[2]:
        meilleure = e
    if e[2] < faible[2]:
        faible = e

# Affichage final
print("\n===== LISTE DES ÉTUDIANTS =====")
for e in etudiants:
    print(e[0], e[1], "- Moyenne :", round(e[2], 2), "- Mention :", e[3])

print("\nMeilleure moyenne :", meilleure[0], meilleure[1], "avec", round(meilleure[2], 2))
print("Plus faible moyenne :", faible[0], faible[1], "avec", round(faible[2], 2))
print("Revois ta vie")