# Git Commands to Push to GitHub

## 1. Initialize Git Repository
```bash
cd C:\Users\Arosha\cisco-ssh-mcp
git init
git add .
git commit -m "Initial commit: Cisco SSH MCP Server"
```

## 2. Create GitHub Repository
1. Go to https://github.com/new
2. Repository name: `cisco-ssh-mcp`
3. Description: `MCP server for SSH connections to Cisco network devices`
4. Set as Public
5. Don't initialize with README (we already have one)
6. Click "Create repository"

## 3. Push to GitHub
```bash
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/cisco-ssh-mcp.git
git push -u origin main
```

## 4. Alternative: Using GitHub CLI
```bash
gh repo create cisco-ssh-mcp --public --source=. --remote=origin --push
```

Replace `YOUR_USERNAME` with your actual GitHub username.
