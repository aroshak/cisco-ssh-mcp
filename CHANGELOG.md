# Changelog

## [1.0.1] - 2025-06-24

### Fixed
- **TypeScript Build Errors**: Fixed type safety issues with defaultConnectionId assignments
- **Regex Patterns**: Corrected escape sequences in route table parsing regex
- **Connection Management**: Improved handling of undefined values from Map.keys().next().value
- **Prompt Detection**: Fixed regex patterns for Cisco device prompt detection

### Technical Details
- Lines 94 & 122: Added proper null checking for `this.connections.keys().next().value`
- Line 382: Fixed regex pattern from `/^([LCSO\\*])\\s+...` to `/^([LCSO*])\s+...`
- Improved type safety throughout the SSH manager
- Enhanced error handling for edge cases

## [1.0.0] - 2025-06-24

### Added
- Initial release of Cisco SSH MCP Server
- 7 comprehensive tools for Cisco device management:
  - `cisco_connect` - Connect to devices with SSH key/password auth
  - `cisco_exec` - Execute CLI commands
  - `cisco_config` - Configuration mode with auto-save option
  - `cisco_show` - Show commands with structured output parsing
  - `cisco_send_raw` - Raw terminal access
  - `cisco_list_connections` - Active connection management
  - `cisco_disconnect` - Clean disconnection handling
- Multiple concurrent SSH connection support
- Command timeout and error handling
- Output parsing for common show commands (interfaces, routes, version)
- Compatible with Cline, Claude Desktop, and any MCP client
- Comprehensive documentation and setup guides
