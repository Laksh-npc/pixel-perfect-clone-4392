#!/bin/bash
# Bash script to setup the backend API
# Run this script from the project root directory

echo "Setting up NSE India Backend API..."

# Check if stock-nse-india directory exists
if [ -d "../stock-nse-india" ]; then
    echo "Backend directory already exists. Skipping clone."
    cd ../stock-nse-india
else
    echo "Cloning stock-nse-india repository..."
    cd ..
    git clone https://github.com/hi-imcodeman/stock-nse-india.git
    cd stock-nse-india
fi

echo "Installing backend dependencies..."
npm install

echo "Installing cross-env for cross-platform compatibility..."
npm install --save-dev cross-env

echo "Replacing yarn with npm in package.json scripts..."
# Replace yarn with npm in package.json scripts to avoid yarn dependency
# macOS compatible sed command
if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' 's/yarn remove-build/npm run remove-build/g' package.json
    sed -i '' 's/yarn copy-graphql/npm run copy-graphql/g' package.json
    sed -i '' 's/yarn build/npm run build/g' package.json
    sed -i '' 's/yarn lint --fix/npm run lint --fix/g' package.json
else
    sed -i 's/yarn remove-build/npm run remove-build/g' package.json
    sed -i 's/yarn copy-graphql/npm run copy-graphql/g' package.json
    sed -i 's/yarn build/npm run build/g' package.json
    sed -i 's/yarn lint --fix/npm run lint --fix/g' package.json
fi

echo "Building backend..."
npm run build

echo "Backend setup complete!"
echo "To start the backend, run: cd ../stock-nse-india && npm start"
echo "The API will be available at http://localhost:3000"

cd ..

