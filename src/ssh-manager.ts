import { Client, ConnectConfig } from 'ssh2';
import { EventEmitter } from 'events';

interface SSHConnection {
  client: Client;
  stream: any;
  config: ConnectConfig & { host: string };
  connected: boolean;
  lastActivity: Date;
}

interface ConnectionInfo {
  connectionId: string;
  host: string;
  port: number;
  username: string;
  connected: boolean;
  lastActivity: string;
}

export class SSHManager extends EventEmitter {
  private connections: Map<string, SSHConnection> = new Map();
  private defaultConnectionId: string | null = null;

  constructor() {
    super();
  }

  async connect(
    connectionId: string,
    config: ConnectConfig & { host: string }
  ): Promise<string> {
    // Disconnect existing connection if it exists
    if (this.connections.has(connectionId)) {
      await this.disconnect(connectionId);
    }

    return new Promise((resolve, reject) => {
      const client = new Client();
      const connection: SSHConnection = {
        client,
        stream: null,
        config,
        connected: false,
        lastActivity: new Date(),
      };

      client.on('ready', async () => {
        try {
          // Create a shell for interactive commands
          client.shell((err, stream) => {
            if (err) {
              reject(new Error(`Failed to create shell: ${err.message}`));
              return;
            }

            connection.stream = stream;
            connection.connected = true;
            connection.lastActivity = new Date();

            this.connections.set(connectionId, connection);
            
            // Set as default if it's the first connection
            if (!this.defaultConnectionId) {
              this.defaultConnectionId = connectionId;
            }

            // Wait for initial prompt and get device info
            this.waitForPrompt(stream, 5000)
              .then(async () => {
                try {
                  const deviceInfo = await this.getDeviceInfo(connectionId);
                  resolve(deviceInfo);
                } catch (error) {
                  resolve('Connected successfully (device info unavailable)');
                }
              })
              .catch(() => {
                resolve('Connected successfully');
              });
          });
        } catch (error) {
          reject(new Error(`Shell creation failed: ${error}`));
        }
      });

      client.on('error', (err) => {
        reject(new Error(`SSH connection failed: ${err.message}`));
      });

      client.on('end', () => {
        this.connections.delete(connectionId);
        if (this.defaultConnectionId === connectionId) {
          // Fix: Handle undefined from keys().next().value
          const nextKey = this.connections.keys().next().value;
          this.defaultConnectionId = this.connections.size > 0 ? nextKey || null : null;
        }
      });

      client.connect(config);
    });
  }

  async disconnect(connectionId?: string): Promise<void> {
    const id = connectionId || this.defaultConnectionId;
    if (!id) {
      throw new Error('No connection specified and no default connection available');
    }

    const connection = this.connections.get(id);
    if (!connection) {
      throw new Error(`Connection ${id} not found`);
    }

    if (connection.stream) {
      connection.stream.end();
    }
    connection.client.end();
    this.connections.delete(id);

    if (this.defaultConnectionId === id) {
      // Fix: Handle undefined from keys().next().value
      const nextKey = this.connections.keys().next().value;
      this.defaultConnectionId = this.connections.size > 0 ? nextKey || null : null;
    }
  }

  async executeCommand(
    command: string,
    connectionId?: string,
    timeout: number = 10000
  ): Promise<string> {
    const connection = this.getConnection(connectionId);
    const stream = connection.stream;

    return new Promise((resolve, reject) => {
      let output = '';
      let timeoutHandle: NodeJS.Timeout;

      const cleanup = () => {
        if (timeoutHandle) clearTimeout(timeoutHandle);
        stream.removeAllListeners('data');
      };

      timeoutHandle = setTimeout(() => {
        cleanup();
        reject(new Error(`Command timeout after ${timeout}ms`));
      }, timeout);

      stream.on('data', (data: Buffer) => {
        output += data.toString();
        
        // Check if we've received the prompt back (simple heuristic)
        if (this.hasPrompt(output)) {
          cleanup();
          resolve(this.cleanOutput(output, command));
        }
      });

      // Send command
      stream.write(command + '\n');
      connection.lastActivity = new Date();
    });
  }

  async configureDevice(
    commands: string[],
    connectionId?: string,
    save: boolean = false
  ): Promise<string> {
    const connection = this.getConnection(connectionId);
    let output = '';

    // Enter configuration mode
    output += await this.executeCommand('configure terminal', connectionId);

    // Execute each configuration command
    for (const command of commands) {
      output += await this.executeCommand(command, connectionId);
    }

    // Exit configuration mode
    output += await this.executeCommand('exit', connectionId);

    // Save configuration if requested
    if (save) {
      output += await this.executeCommand('write memory', connectionId);
    }

    return output;
  }

  async executeShowCommand(
    command: string,
    connectionId?: string,
    parseOutput: boolean = false
  ): Promise<string> {
    const output = await this.executeCommand(command, connectionId);
    
    if (parseOutput) {
      return this.parseShowOutput(command, output);
    }
    
    return output;
  }

  async sendRaw(
    text: string,
    connectionId?: string,
    waitForPrompt: boolean = true
  ): Promise<string> {
    const connection = this.getConnection(connectionId);
    const stream = connection.stream;

    if (!waitForPrompt) {
      stream.write(text);
      connection.lastActivity = new Date();
      return 'Text sent (no response waited)';
    }

    return new Promise((resolve, reject) => {
      let output = '';
      const timeout = setTimeout(() => {
        stream.removeAllListeners('data');
        reject(new Error('Timeout waiting for response'));
      }, 10000);

      stream.on('data', (data: Buffer) => {
        output += data.toString();
        
        if (this.hasPrompt(output)) {
          clearTimeout(timeout);
          stream.removeAllListeners('data');
          resolve(output);
        }
      });

      stream.write(text);
      connection.lastActivity = new Date();
    });
  }

  listConnections(): ConnectionInfo[] {
    return Array.from(this.connections.entries()).map(([id, conn]) => ({
      connectionId: id,
      host: conn.config.host,
      port: conn.config.port || 22,
      username: conn.config.username || 'unknown',
      connected: conn.connected,
      lastActivity: conn.lastActivity.toISOString(),
    }));
  }

  private getConnection(connectionId?: string): SSHConnection {
    const id = connectionId || this.defaultConnectionId;
    if (!id) {
      throw new Error('No connection specified and no default connection available');
    }

    const connection = this.connections.get(id);
    if (!connection) {
      throw new Error(`Connection ${id} not found`);
    }

    if (!connection.connected) {
      throw new Error(`Connection ${id} is not connected`);
    }

    return connection;
  }

  private async getDeviceInfo(connectionId: string): Promise<string> {
    try {
      const version = await this.executeCommand('show version', connectionId, 5000);
      const hostname = await this.executeCommand('show running-config | include hostname', connectionId, 3000);
      
      // Extract basic info
      const lines = version.split('\n');
      const versionLine = lines.find(line => line.includes('Version')) || 'Version info not found';
      const hostnameMatch = hostname.match(/hostname\s+(\S+)/) || ['', 'Unknown'];
      
      return `Hostname: ${hostnameMatch[1]}, ${versionLine.trim()}`;
    } catch (error) {
      return 'Device info unavailable';
    }
  }

  private async waitForPrompt(stream: any, timeout: number = 5000): Promise<void> {
    return new Promise((resolve, reject) => {
      let output = '';
      const timeoutHandle = setTimeout(() => {
        stream.removeAllListeners('data');
        reject(new Error('Timeout waiting for prompt'));
      }, timeout);

      stream.on('data', (data: Buffer) => {
        output += data.toString();
        if (this.hasPrompt(output)) {
          clearTimeout(timeoutHandle);
          stream.removeAllListeners('data');
          resolve();
        }
      });

      // Send a newline to trigger the prompt
      stream.write('\n');
    });
  }

  private hasPrompt(output: string): boolean {
    // Common Cisco prompt patterns
    const promptPatterns = [
      /#\s*$/,  // Privileged mode
      />\s*$/,  // User mode
      /\(config\)#\s*$/,  // Configuration mode
      /\(config-\w+\)#\s*$/,  // Sub-configuration mode
    ];

    return promptPatterns.some(pattern => pattern.test(output.trim()));
  }

  private cleanOutput(output: string, command: string): string {
    // Remove the echoed command and prompt
    const lines = output.split('\n');
    const cleanLines = lines.filter((line, index) => {
      // Skip the first line if it contains the command
      if (index === 0 && line.includes(command)) return false;
      // Skip lines that look like prompts
      if (this.hasPrompt(line)) return false;
      return true;
    });

    return cleanLines.join('\n').trim();
  }

  private parseShowOutput(command: string, output: string): string {
    // Basic parsing for common show commands
    // This could be expanded with more sophisticated parsing
    
    if (command.includes('show ip interface brief')) {
      return this.parseInterfaceBrief(output);
    } else if (command.includes('show ip route')) {
      return this.parseRouteTable(output);
    } else if (command.includes('show version')) {
      return this.parseVersion(output);
    }

    return output; // Return raw output if no parser available
  }

  private parseInterfaceBrief(output: string): string {
    try {
      const lines = output.split('\n');
      const interfaces = [];
      
      for (const line of lines) {
        const match = line.match(/^(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)/);
        if (match && !line.includes('Interface')) {
          interfaces.push({
            interface: match[1],
            ipAddress: match[2],
            ok: match[3],
            method: match[4],
            status: match[5],
            protocol: match[6]
          });
        }
      }
      
      return JSON.stringify(interfaces, null, 2);
    } catch (error) {
      return output;
    }
  }

  private parseRouteTable(output: string): string {
    try {
      const lines = output.split('\n');
      const routes = [];
      
      for (const line of lines) {
        // Fix: Corrected regex escape sequences
        const match = line.match(/^([LCSO*])\s+(\S+)\s+\[([^\]]+)\]\s+via\s+(\S+)/);
        if (match) {
          routes.push({
            code: match[1],
            network: match[2],
            adminDistance: match[3],
            nextHop: match[4]
          });
        }
      }
      
      return JSON.stringify(routes, null, 2);
    } catch (error) {
      return output;
    }
  }

  private parseVersion(output: string): string {
    try {
      const version = {
        ios: '',
        hostname: '',
        uptime: '',
        model: '',
        serial: '',
        memory: ''
      };
      
      const lines = output.split('\n');
      for (const line of lines) {
        if (line.includes('IOS')) {
          version.ios = line.trim();
        } else if (line.includes('uptime is')) {
          version.uptime = line.trim();
        } else if (line.includes('Model number')) {
          version.model = line.trim();
        } else if (line.includes('System serial number')) {
          version.serial = line.trim();
        }
      }
      
      return JSON.stringify(version, null, 2);
    } catch (error) {
      return output;
    }
  }
}
