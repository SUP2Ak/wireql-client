#!/bin/bash

# Script de publication du package @wireql/client

set -e

echo "🚀 Publication du package wireql-client"
echo "========================================"

# Vérification des prérequis
echo "📋 Vérification des prérequis..."
if ! command -v npm &> /dev/null; then
    echo "❌ npm n'est pas installé"
    exit 1
fi

if ! command -v git &> /dev/null; then
    echo "❌ git n'est pas installé"
    exit 1
fi

# Vérification que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo "❌ package.json non trouvé. Exécutez ce script depuis le répertoire du package."
    exit 1
fi

# Vérification que nous sommes connectés à npm
echo "🔑 Vérification de la connexion npm..."
npm whoami || { echo "❌ Vous devez être connecté à npm (npm login)"; exit 1; }

# Clean et rebuild
echo "🧹 Nettoyage et reconstruction..."
npm run clean 2>/dev/null || rm -rf dist
npm run build

# Tests
echo "🧪 Exécution des tests..."
npm test

# Vérification du package
echo "📦 Vérification du package..."
npm pack --dry-run

# Version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "📌 Version actuelle: $CURRENT_VERSION"

# Demande de confirmation
echo ""
echo "🎯 Prêt à publier wireql-client@$CURRENT_VERSION"
echo "   - Tests: ✅"
echo "   - Build: ✅"
echo "   - Types: ✅"
echo ""
read -p "Confirmer la publication? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Publication annulée"
    exit 1
fi

# Publication
echo "📤 Publication en cours..."
npm publish --access public

# Tag git (optionnel)
echo "🏷️  Création du tag git..."
git tag "v$CURRENT_VERSION" 2>/dev/null || echo "⚠️  Tag déjà existant ou erreur git"

echo ""
echo "🎉 Publication réussie!"
echo "📦 Package: wireql-client@$CURRENT_VERSION"
echo "🔗 URL: https://www.npmjs.com/package/wireql-client"
echo ""
echo "📚 Prochaines étapes:"
echo "   - Mettre à jour le CHANGELOG.md"
echo "   - Pousser les tags: git push origin --tags"
echo "   - Annoncer la release sur GitHub" 