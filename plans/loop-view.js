#!/usr/bin/env node

const fastify = require('fastify')({ logger: false });
const fs = require('fs');
const path = require('path');

// Configuration
const PORT = 3001;
const LOG_FILE = path.join(__dirname, 'loop.log');

// Register WebSocket support
fastify.register(require('@fastify/websocket'));

// HTML template with inline CSS using Tailwind CDN
const HTML_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Claude Code CLI Log Viewer</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    colors: {
                        'claude-blue': '#2563eb',
                        'claude-purple': '#7c3aed'
                    }
                }
            }
        }
    </script>
    <style>
        .log-entry {
            transition: all 0.2s ease-in-out;
        }
        .log-entry:hover {
            transform: translateX(2px);
        }
        .json-key { color: #0ea5e9; }
        .json-string { color: #10b981; }
        .json-number { color: #f59e0b; }
        .json-boolean { color: #ef4444; }
        .json-null { color: #6b7280; }
        .animate-pulse-soft {
            animation: pulse-soft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse-soft {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
        }
    </style>
</head>
<body class="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-mono text-sm">
    <!-- Header -->
    <header class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 sticky top-0 z-50">
        <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
                <h1 class="text-xl font-bold text-claude-blue dark:text-claude-purple">Claude Code CLI Log Viewer</h1>
                <div class="flex items-center space-x-2">
                    <div id="status-indicator" class="w-3 h-3 bg-gray-400 rounded-full animate-pulse-soft"></div>
                    <span id="status-text" class="text-sm text-gray-600 dark:text-gray-400">Connecting...</span>
                </div>
            </div>
            <div class="flex items-center space-x-4">
                <div class="text-sm text-gray-600 dark:text-gray-400">
                    Entries: <span id="entry-count" class="font-semibold">0</span>
                </div>
                <button id="theme-toggle" class="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
                    </svg>
                </button>
                <button id="clear-logs" class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors">
                    Clear
                </button>
                <button id="auto-scroll-toggle" class="px-4 py-2 bg-claude-blue hover:bg-blue-600 text-white rounded-lg transition-colors">
                    Auto-scroll: ON
                </button>
            </div>
        </div>
    </header>

    <!-- Filters -->
    <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3">
        <div class="flex items-center space-x-4">
            <div class="flex items-center space-x-2">
                <label class="text-sm font-medium">Filter:</label>
                <select id="type-filter" class="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm">
                    <option value="">All Types</option>
                    <option value="loop_start_marker">Loop Start</option>
                    <option value="system">System</option>
                    <option value="stream_event">Stream Events</option>
                    <option value="assistant">Assistant</option>
                    <option value="user">User</option>
                </select>
            </div>
            <div class="flex items-center space-x-2">
                <label class="text-sm font-medium">Search:</label>
                <input id="search-input" type="text" placeholder="Search in messages..."
                       class="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm w-64">
            </div>
        </div>
    </div>

    <!-- Log Container -->
    <main class="flex-1 overflow-hidden">
        <div id="log-container" class="h-screen overflow-y-auto px-6 py-4 space-y-2 pb-32">
            <!-- Log entries will be inserted here -->
        </div>
    </main>

    <script>
        class LogViewer {
            constructor() {
                this.ws = null;
                this.logs = [];
                this.filteredLogs = [];
                this.autoScroll = true;
                this.currentFilter = '';
                this.currentSearch = '';
                this.isDark = localStorage.getItem('darkMode') === 'true';

                this.initializeElements();
                this.initializeTheme();
                this.initializeEventListeners();
                this.connectWebSocket();
            }

            initializeElements() {
                this.logContainer = document.getElementById('log-container');
                this.statusIndicator = document.getElementById('status-indicator');
                this.statusText = document.getElementById('status-text');
                this.entryCount = document.getElementById('entry-count');
                this.typeFilter = document.getElementById('type-filter');
                this.searchInput = document.getElementById('search-input');
                this.themeToggle = document.getElementById('theme-toggle');
                this.clearButton = document.getElementById('clear-logs');
                this.autoScrollButton = document.getElementById('auto-scroll-toggle');
            }

            initializeTheme() {
                if (this.isDark) {
                    document.documentElement.classList.add('dark');
                }
            }

            initializeEventListeners() {
                this.themeToggle.addEventListener('click', () => this.toggleTheme());
                this.clearButton.addEventListener('click', () => this.clearLogs());
                this.autoScrollButton.addEventListener('click', () => this.toggleAutoScroll());
                this.typeFilter.addEventListener('change', (e) => this.setFilter(e.target.value));
                this.searchInput.addEventListener('input', (e) => this.setSearch(e.target.value));

                // Auto-scroll detection
                this.logContainer.addEventListener('scroll', () => {
                    const { scrollTop, scrollHeight, clientHeight } = this.logContainer;
                    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 50;

                    if (!isAtBottom && this.autoScroll) {
                        this.autoScroll = false;
                        this.updateAutoScrollButton();
                    }
                });
            }

            connectWebSocket() {
                const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                const wsUrl = \`\${protocol}//\${window.location.host}/ws\`;

                this.ws = new WebSocket(wsUrl);

                this.ws.onopen = () => {
                    this.updateStatus('connected', 'Connected');
                };

                this.ws.onmessage = (event) => {
                    const logEntry = JSON.parse(event.data);
                    this.addLogEntry(logEntry);
                };

                this.ws.onclose = () => {
                    this.updateStatus('disconnected', 'Disconnected');
                    // Attempt to reconnect after 3 seconds
                    setTimeout(() => this.connectWebSocket(), 3000);
                };

                this.ws.onerror = () => {
                    this.updateStatus('error', 'Connection Error');
                };
            }

            updateStatus(status, text) {
                this.statusText.textContent = text;
                this.statusIndicator.className = \`w-3 h-3 rounded-full \${
                    status === 'connected' ? 'bg-green-500' :
                    status === 'disconnected' ? 'bg-yellow-500' :
                    'bg-red-500'
                }\`;
            }

            addLogEntry(entry) {
                this.logs.push(entry);
                this.updateFilteredLogs();
                this.updateEntryCount();

                if (this.autoScroll) {
                    this.scrollToBottom();
                }
            }

            updateFilteredLogs() {
                this.filteredLogs = this.logs.filter(log => {
                    const matchesType = !this.currentFilter || log.type === this.currentFilter;
                    const matchesSearch = !this.currentSearch ||
                        JSON.stringify(log).toLowerCase().includes(this.currentSearch.toLowerCase());
                    return matchesType && matchesSearch;
                });

                this.renderLogs();
            }

            renderLogs() {
                this.logContainer.innerHTML = this.filteredLogs.map((log, index) =>
                    this.renderLogEntry(log, index)
                ).join('');
            }

            renderLogEntry(log, index) {
                const timestamp = new Date().toLocaleTimeString();
                const typeColor = this.getTypeColor(log.type);
                const formattedContent = this.formatLogContent(log);

                return \`
                    <div class="log-entry bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
                        <div class="flex items-start justify-between mb-2">
                            <div class="flex items-center space-x-3">
                                <span class="px-2 py-1 text-xs font-medium rounded-full \${typeColor}">
                                    \${log.type}
                                </span>
                                <span class="text-xs text-gray-500 dark:text-gray-400">
                                    #\${index + 1}
                                </span>
                                <span class="text-xs text-gray-500 dark:text-gray-400">
                                    \${timestamp}
                                </span>
                            </div>
                            <button onclick="logViewer.copyToClipboard(\${index})"
                                    class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                                </svg>
                            </button>
                        </div>
                        <div class="overflow-x-auto">
                            <pre class="text-sm whitespace-pre-wrap break-words">\${formattedContent}</pre>
                        </div>
                    </div>
                \`;
            }

            getTypeColor(type) {
                const colors = {
                    'loop_start_marker': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
                    'system': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
                    'stream_event': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
                    'assistant': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
                    'user': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                };
                return colors[type] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
            }

            formatLogContent(log) {
                // Create a clean copy without uuid and session_id for display
                const cleanLog = { ...log };
                delete cleanLog.uuid;
                delete cleanLog.session_id;

                return this.syntaxHighlightJSON(JSON.stringify(cleanLog, null, 2));
            }

            syntaxHighlightJSON(json) {
                return json
                    .replace(/("([^"\\\\]|\\\\.)*")(\\s*:)/g, '<span class="json-key">$1</span>$3')
                    .replace(/("([^"\\\\]|\\\\.)*")(?!\\s*:)/g, '<span class="json-string">$1</span>')
                    .replace(/\\b(-?\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?)\\b/g, '<span class="json-number">$1</span>')
                    .replace(/\\b(true|false)\\b/g, '<span class="json-boolean">$1</span>')
                    .replace(/\\bnull\\b/g, '<span class="json-null">null</span>');
            }

            toggleTheme() {
                this.isDark = !this.isDark;
                document.documentElement.classList.toggle('dark', this.isDark);
                localStorage.setItem('darkMode', this.isDark);
            }

            clearLogs() {
                this.logs = [];
                this.filteredLogs = [];
                this.renderLogs();
                this.updateEntryCount();
            }

            toggleAutoScroll() {
                this.autoScroll = !this.autoScroll;
                this.updateAutoScrollButton();
                if (this.autoScroll) {
                    this.scrollToBottom();
                }
            }

            updateAutoScrollButton() {
                this.autoScrollButton.textContent = \`Auto-scroll: \${this.autoScroll ? 'ON' : 'OFF'}\`;
                this.autoScrollButton.className = \`px-4 py-2 text-white rounded-lg transition-colors \${
                    this.autoScroll ? 'bg-claude-blue hover:bg-blue-600' : 'bg-gray-500 hover:bg-gray-600'
                }\`;
            }

            setFilter(filter) {
                this.currentFilter = filter;
                this.updateFilteredLogs();
            }

            setSearch(search) {
                this.currentSearch = search;
                this.updateFilteredLogs();
            }

            updateEntryCount() {
                this.entryCount.textContent = this.filteredLogs.length;
            }

            scrollToBottom() {
                setTimeout(() => {
                    this.logContainer.scrollTop = this.logContainer.scrollHeight;
                }, 10);
            }

            copyToClipboard(index) {
                const log = this.filteredLogs[index];
                navigator.clipboard.writeText(JSON.stringify(log, null, 2)).then(() => {
                    // Show a brief feedback
                    const button = event.target.closest('button');
                    const originalHTML = button.innerHTML;
                    button.innerHTML = '<span class="text-green-500">Copied!</span>';
                    setTimeout(() => {
                        button.innerHTML = originalHTML;
                    }, 1000);
                });
            }
        }

        // Initialize the log viewer when the page loads
        let logViewer;
        document.addEventListener('DOMContentLoaded', () => {
            logViewer = new LogViewer();
        });
    </script>
</body>
</html>
`;

// Serve the HTML page
fastify.get('/', async (request, reply) => {
    reply.type('text/html').send(HTML_TEMPLATE);
});

// WebSocket endpoint for real-time log streaming
fastify.register(async function (fastify) {
    fastify.get('/ws', { websocket: true }, (connection, req) => {
        console.log('Client connected');

        // Track the current position in the log file
        let lastPosition = 0;

        // Send existing log entries first
        if (fs.existsSync(LOG_FILE)) {
            const logContent = fs.readFileSync(LOG_FILE, 'utf8');
            const lines = logContent.split('\n').filter(line => line.trim());

            lines.forEach(line => {
                try {
                    const logEntry = JSON.parse(line);
                    connection.socket.send(JSON.stringify(logEntry));
                } catch (err) {
                    // Skip invalid JSON lines
                }
            });

            lastPosition = logContent.length;
        }

        // Watch for new log entries
        const watcher = fs.watchFile(LOG_FILE, { interval: 100 }, (curr, prev) => {
            if (curr.size > lastPosition) {
                const stream = fs.createReadStream(LOG_FILE, {
                    start: lastPosition,
                    end: curr.size
                });

                let buffer = '';
                stream.on('data', (chunk) => {
                    buffer += chunk.toString();
                    const lines = buffer.split('\n');

                    // Process complete lines
                    for (let i = 0; i < lines.length - 1; i++) {
                        const line = lines[i].trim();
                        if (line) {
                            try {
                                const logEntry = JSON.parse(line);
                                connection.socket.send(JSON.stringify(logEntry));
                            } catch (err) {
                                // Skip invalid JSON lines
                            }
                        }
                    }

                    // Keep the incomplete line in buffer
                    buffer = lines[lines.length - 1];
                });

                stream.on('end', () => {
                    lastPosition = curr.size;
                });
            }
        });

        connection.socket.on('close', () => {
            console.log('Client disconnected');
            fs.unwatchFile(LOG_FILE);
        });
    });
});

// Start the server
const start = async () => {
    try {
        await fastify.listen({ port: PORT, host: '0.0.0.0' });
        console.log(\`\`);
        console.log(\`=€ Claude Code CLI Log Viewer running at:\`);
        console.log(\`   http://localhost:\${PORT}\`);
        console.log(\`\`);
        console.log(\`=Á Watching log file: \${LOG_FILE}\`);
        console.log(\`\`);

        // Check if log file exists
        if (!fs.existsSync(LOG_FILE)) {
            console.log(\`   Log file doesn't exist yet. It will be created when Claude Code CLI starts logging.\`);
        } else {
            const stats = fs.statSync(LOG_FILE);
            console.log(\`=Ê Log file size: \${(stats.size / 1024).toFixed(2)} KB\`);
        }
        console.log(\`\`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n=Ñ Shutting down log viewer...');
    await fastify.close();
    process.exit(0);
});

start();