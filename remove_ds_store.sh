#!/bin/bash

echo "Rimozione dei file .DS_Store dal repository..."

# Rimuove i file .DS_Store dall'indice di git (non li elimina fisicamente)
git rm --cached "**/.DS_Store"

echo "File .DS_Store rimossi dall'indice di git."
echo "Esegui un commit per finalizzare la rimozione."
echo "I file .DS_Store locali sono ancora presenti ma non verranno più tracciati."
echo ""
echo "Esegui: git commit -m \"Rimossi file .DS_Store dal repository\""
