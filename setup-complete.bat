@echo off
echo ========================================
echo   Cisco SSH MCP + GitHub Setup Script
echo ========================================
echo.

cd /d C:\Users\Arosha\cisco-ssh-mcp

echo 1. Installing Smithery GitHub MCP for Claude Desktop...
npx -y @smithery/cli install @smithery-ai/github --client claude --profile philosophical-sloth-9BmqG0 --key 59e3dff3-228a-46d5-af24-9d84d11bad8e

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Smithery GitHub MCP installation failed
    echo Try running this manually: npx -y @smithery/cli install @smithery-ai/github --client claude
    pause
    exit /b 1
)

echo ✅ Smithery GitHub MCP installed successfully
echo.

echo 2. Initializing Git repository...
git init
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Git init failed - make sure Git is installed
    pause
    exit /b 1
)

echo 3. Adding all files to Git...
git add .

echo 4. Creating initial commit...
git commit -m "Initial commit: Cisco SSH MCP Server for network device automation

- Complete MCP server implementation for Cisco SSH connections
- Support for multiple concurrent device connections  
- 7 tools: connect, exec, config, show, send_raw, list_connections, disconnect
- SSH key and password authentication support
- Command timeout and error handling
- Output parsing for structured data
- Configuration mode with save option
- Compatible with Cline, Claude Desktop, and any MCP client"

echo 5. Setting main branch...
git branch -M main

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo ✅ Smithery GitHub MCP installed
echo ✅ Git repository initialized
echo ✅ Initial commit created
echo.
echo 🔄 Next Steps:
echo 1. Restart Claude Desktop to load GitHub MCP
echo 2. Use GitHub tools to create repository
echo 3. Install project dependencies: npm install
echo 4. Build the project: npm run build
echo 5. Configure in Cline MCP settings
echo.
echo 📝 For Cline configuration, add:
echo {
echo   "mcpServers": {
echo     "cisco-ssh": {
echo       "command": "node",
echo       "args": ["C:/Users/Arosha/cisco-ssh-mcp/dist/index.js"]
echo     }
echo   }
echo }
echo.
pause
