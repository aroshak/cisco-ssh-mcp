@echo off
echo Setting up Cisco SSH MCP Repository with Smithery CLI...
echo.

cd /d C:\Users\Arosha\cisco-ssh-mcp

echo Installing Smithery GitHub MCP...
npx -y @smithery/cli@latest install @smithery-ai/github --client claude --profile philosophical-sloth-9BmqG0 --key 59e3dff3-228a-46d5-af24-9d84d11bad8e

echo.
echo Initializing Git repository...
git init

echo.
echo Adding all files...
git add .

echo.
echo Creating initial commit...
git commit -m "Initial commit: Cisco SSH MCP Server for network device automation

- Complete MCP server implementation for Cisco SSH connections
- Support for multiple concurrent device connections  
- 7 tools: connect, exec, config, show, send_raw, list_connections, disconnect
- SSH key and password authentication support
- Command timeout and error handling
- Output parsing for structured data
- Configuration mode with save option
- Compatible with Cline, Claude Desktop, and any MCP client"

echo.
echo Setting main branch...
git branch -M main

echo.
echo ✅ Repository setup complete!
echo.
echo Next steps:
echo 1. Create repository on GitHub using Smithery CLI or manually
echo 2. Add remote origin and push
echo 3. Install dependencies with: npm install
echo 4. Build project with: npm run build
echo 5. Configure in Cline MCP settings
echo.
pause
