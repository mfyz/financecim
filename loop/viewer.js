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
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
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
            transition: shadow 0.2s ease-in-out;
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
                const wsUrl = protocol + '//' + window.location.host + '/ws';

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
                this.statusIndicator.className = 'w-3 h-3 rounded-full ' + (
                    status === 'connected' ? 'bg-green-500' :
                    status === 'disconnected' ? 'bg-yellow-500' :
                    'bg-red-500'
                );
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

            renderStreamEventPills(streamEvents) {
                const pillsHtml = streamEvents.map(({ log, index }) => {
                    const eventType = log.event?.type || 'unknown';
                    const pillColor = this.getStreamEventColor(eventType);

                    return '<button onclick="logViewer.expandStreamEvent(' + index + ')" ' +
                        'class="inline-block w-3 h-3 rounded-full mr-2 mb-2 hover:scale-110 transition-transform cursor-pointer ' + pillColor + '" ' +
                        'title="' + eventType + '"></button>';
                }).join('');

                return '<div class="flex flex-wrap items-center px-6 py-2">' +
                    '<span class="text-xs text-gray-400 mr-3">' + streamEvents.length + ' events:</span>' +
                    pillsHtml +
                '</div>';
            }

            getStreamEventColor(eventType) {
                const colors = {
                    'message_start': 'bg-blue-400',
                    'content_block_start': 'bg-green-400',
                    'content_block_delta': 'bg-yellow-400',
                    'content_block_stop': 'bg-red-400',
                    'message_delta': 'bg-purple-400',
                    'message_stop': 'bg-gray-400'
                };
                return colors[eventType] || 'bg-gray-300';
            }

            renderLogEntry(log, index) {
                // Handle stream events specially - render as mini pills
                if (log.type === 'stream_event') {
                    const eventType = log.event?.type || 'unknown';
                    const pillColor = this.getStreamEventColor(eventType);

                    return '<div class="inline-block mr-1 mb-1">' +
                        '<button onclick="logViewer.expandStreamEvent(' + index + ')" ' +
                        'class="inline-block w-2 h-2 rounded-full hover:scale-110 transition-transform cursor-pointer opacity-50 ' + pillColor + '" ' +
                        'title="' + eventType + '"></button>' +
                    '</div>';
                }

                // Handle user messages specially - render as mini pills like stream events
                if (log.type === 'user') {
                    return '<div class="inline-block mr-1 mb-1">' +
                        '<button onclick="logViewer.expandUserMessage(' + index + ')" ' +
                        'class="inline-block w-2 h-2 rounded-full hover:scale-110 transition-transform cursor-pointer opacity-50 bg-indigo-400" ' +
                        'title="User message"></button>' +
                    '</div>';
                }

                // Regular rendering for non-stream events
                const timestamp = new Date().toLocaleTimeString();
                const typeColor = this.getTypeColor(log.type);
                const formattedContent = this.formatLogContent(log);

                // Determine card styling based on message type
                const cardStyling = this.getCardStyling(log);

                return '<div class="log-entry ' + cardStyling + ' rounded-lg p-4 hover:shadow-md transition-shadow">' +
                    '<div class="overflow-x-auto mb-3">' +
                        this.renderContentByType(log, formattedContent, index) +
                    '</div>' +
                    '<div class="flex items-center justify-between text-xs opacity-50">' +
                        '<div class="flex items-center space-x-3">' +
                            '<span class="px-2 py-1 font-medium rounded-full ' + typeColor + '">' +
                                log.type +
                            '</span>' +
                            '<span class="text-gray-500 dark:text-gray-400">' +
                                '#' + (index + 1) +
                            '</span>' +
                            '<span class="text-gray-500 dark:text-gray-400">' +
                                timestamp +
                            '</span>' +
                            (this.hasRawJson(log) ?
                                '<button onclick="logViewer.showRawJsonModal(' + index + ')" class="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors opacity-100">' +
                                    'Show raw JSON' +
                                '</button>' : '') +
                        '</div>' +
                        '<button onclick="logViewer.copyToClipboard(' + index + ')"' +
                                ' class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors opacity-100">' +
                            '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">' +
                                '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>' +
                            '</svg>' +
                        '</button>' +
                    '</div>' +
                '</div>';
            }

            renderContentByType(log, formattedContent, index) {
                if (log.type === 'loop_start_marker') {
                    return '<h1 class="text-xl font-bold text-blue-600 dark:text-blue-400">' +
                        this.escapeHtml(log.message) +
                    '</h1>';
                }

                if (log.type === 'system' && log.subtype === 'init') {
                    return '<div class="text-lg font-semibold text-green-600 dark:text-green-400">' +
                        '⚙️ System Init' +
                    '</div>';
                }

                if (log.type === 'result' && log.subtype === 'success') {
                    const duration = log.duration_ms ? (log.duration_ms / 1000).toFixed(1) + 's' : 'unknown';
                    return '<div class="text-md font-medium text-emerald-600 dark:text-emerald-400">' +
                        '✅ Completed in ' + duration +
                    '</div>';
                }

                if (log.type === 'loop_end_summary') {
                    const summaryText = log.summary || '';
                    const markdownHtml = this.parseMarkdown(summaryText);
                    return '<div class="prose prose-lg max-w-none text-gray-800 dark:text-gray-200">' +
                        '<div class="font-semibold text-blue-600 dark:text-blue-400 mb-2">📋 Loop Summary</div>' +
                        markdownHtml +
                    '</div>';
                }

                if (log.type === 'loop_all_completed') {
                    const message = log.message || 'Loop complete';
                    return '<h1 class="text-xl font-bold text-center text-green-600 dark:text-green-400">' +
                        message +
                    '</h1>';
                }

                if (log.type === 'assistant' && log.message?.content) {
                    // Check for tool use first
                    const toolUse = log.message.content.find(item => item.type === 'tool_use');
                    if (toolUse) {
                        const toolName = toolUse.name || 'Unknown';
                        const inputSummary = this.formatToolInputSummary(toolUse.input, toolName);

                        // Special rendering for TodoWrite tool
                        if (toolName === 'TodoWrite' && toolUse.input && toolUse.input.todos) {
                            const todos = toolUse.input.todos;
                            const completedCount = todos.filter(t => t.status === 'completed').length;
                            const totalCount = todos.length;
                            const inProgressTodo = todos.find(t => t.status === 'in_progress');
                            const hasInProgressOrCompleted = todos.some(t => t.status === 'in_progress' || t.status === 'completed');

                            // If no items are in progress or completed (first time), show full list
                            if (!hasInProgressOrCompleted) {
                                const todoList = this.renderTodoList(todos);
                                return '<div class="text-md text-gray-700 dark:text-gray-300">' +
                                    '<span class="font-medium">🛠 Tool: ' + toolName + '</span>' +
                                    '<div class="mt-2">' + todoList + '</div>' +
                                '</div>';
                            }

                            // Otherwise show compact progress format
                            // Include the in-progress task in the count (completed + 1 if there's an in-progress task)
                            const currentProgress = inProgressTodo ? completedCount + 1 : completedCount;
                            const progressText = currentProgress + '/' + totalCount;
                            const currentTaskText = inProgressTodo ? ' ▶ ' + inProgressTodo.content : '';

                            return '<div class="text-md text-gray-700 dark:text-gray-300">' +
                                '<span class="font-medium">🛠 Tool: ' + toolName + ' ' + progressText + currentTaskText + '</span>' +
                            '</div>';
                        }

                        // Special rendering for Bash commands
                        if (toolName === 'Bash' && toolUse.input && toolUse.input.command) {
                            return '<div class="text-md text-gray-700 dark:text-gray-300">' +
                                '<span class="font-medium">🛠 Tool: ' + toolName + ' cmd: ' + this.escapeHtml(toolUse.input.command.substring(0, 30)) + (toolUse.input.command.length > 30 ? '...' : '') + '</span>' +
                                '<div class="mt-2"><div class="inline-block px-3 py-2 bg-black text-green-400 rounded text-sm font-mono">' + this.escapeHtml(toolUse.input.command) + '</div></div>' +
                            '</div>';
                        }

                        return '<div class="text-md text-gray-700 dark:text-gray-300">' +
                            '<span class="font-medium">🛠 Tool: ' + toolName + '</span>' +
                            (inputSummary ? '<span class="text-gray-600 dark:text-gray-400"> ' + inputSummary + '</span>' : '') +
                        '</div>';
                    }

                    // Find text content in the message
                    const textContent = log.message.content.find(item => item.type === 'text');
                    if (textContent && textContent.text) {
                        // Use markdown parsing for multi-line text content
                        const markdownHtml = this.parseMarkdown(textContent.text);
                        return '<div class="prose prose-lg max-w-none text-gray-800 dark:text-gray-200">' +
                            markdownHtml +
                        '</div>';
                    }
                }

                // Default rendering for other types
                return '<pre class="text-sm whitespace-pre-wrap break-words">' + formattedContent + '</pre>';
            }

            renderTodoList(todos) {
                if (!todos || !Array.isArray(todos)) return '';

                const todoItems = todos.map(todo => {
                    let statusIcon = '';
                    let statusClass = '';

                    switch (todo.status) {
                        case 'pending':
                            statusIcon = '☐'; // U+2610
                            statusClass = 'text-gray-600 dark:text-gray-400';
                            break;
                        case 'in_progress':
                            statusIcon = '▶'; // Play/arrow icon
                            statusClass = 'text-orange-600 dark:text-orange-400';
                            break;
                        case 'completed':
                            statusIcon = '✓'; // U+2713
                            statusClass = 'text-green-600 dark:text-green-400 opacity-70';
                            break;
                        default:
                            statusIcon = '☐';
                            statusClass = 'text-gray-600 dark:text-gray-400';
                    }

                    const itemClass = todo.status === 'completed' ? 'opacity-70' : '';

                    return '<li class="flex items-start space-x-2 ' + itemClass + '">' +
                        '<span class="' + statusClass + ' font-mono">' + statusIcon + '</span>' +
                        '<span class="flex-1">' + this.escapeHtml(todo.content) + '</span>' +
                    '</li>';
                }).join('');

                return '<ul class="text-lg space-y-1 mt-1 pl-0 ml-5">' + todoItems + '</ul>';
            }

            formatToolInputSummary(input, toolName) {
                if (!input) return '';

                // Skip summary for TodoWrite since we render the full list
                if (toolName === 'TodoWrite') return '';

                // Create tool-specific summaries
                switch (toolName) {
                    case 'Read':
                        return input.file_path ? 'file: <span class="inline-block px-1 py-0.5 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded text-sm font-mono">' + input.file_path.split('/').pop() + '</span>' : '';
                    case 'Edit':
                    case 'MultiEdit':
                        return input.file_path ? 'file: <span class="inline-block px-1 py-0.5 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded text-sm font-mono">' + input.file_path.split('/').pop() + '</span>' : '';
                    case 'Write':
                        return input.file_path ? 'file: <span class="inline-block px-1 py-0.5 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded text-sm font-mono">' + input.file_path.split('/').pop() + '</span>' : '';
                    case 'Bash':
                        return input.command ? '' : '';
                    case 'Grep':
                        return input.pattern ? 'pattern: ' + input.pattern : '';
                    case 'Glob':
                        return input.pattern ? 'pattern: ' + input.pattern : '';
                    default:
                        // For other tools, try to find the most relevant input field
                        const keys = Object.keys(input);
                        if (keys.length === 0) return '';
                        const firstKey = keys[0];
                        const value = input[firstKey];
                        if (typeof value === 'string' && value.length > 0) {
                            return firstKey + ': ' + (value.length > 30 ? value.substring(0, 30) + '...' : value);
                        }
                        return '';
                }
            }

            parseMarkdown(text) {
                // Configure marked for proper line break handling
                marked.setOptions({
                    breaks: true,        // Convert single line breaks to <br>
                    gfm: true,          // Enable GitHub flavored markdown
                    sanitize: false,    // Allow HTML (we trust our own content)
                    smartypants: false  // Disable smart quotes to avoid encoding issues
                });

                return marked.parse(text);
            }

            escapeHtml(text) {
                const div = document.createElement('div');
                div.textContent = text;
                return div.innerHTML;
            }

            getCardStyling(log) {
                // Special styling for loop all completed messages (green background)
                if (log.type === 'loop_all_completed') {
                    return 'bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-600';
                }

                // Special styling for loop end summary messages (blue background)
                if (log.type === 'loop_end_summary') {
                    return 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-600';
                }

                // Special styling for result success messages (green background)
                if (log.type === 'result' && log.subtype === 'success') {
                    return 'bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-600';
                }

                // Special styling for assistant text messages (yellow background)
                if (log.type === 'assistant' && log.message?.content) {
                    const hasTextContent = log.message.content.some(item => item.type === 'text');
                    if (hasTextContent) {
                        return 'bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-600';
                    }
                }

                // Default styling for other messages (white background)
                return 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800';
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

                return this.escapeHtml(JSON.stringify(cleanLog, null, 2));
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
                this.autoScrollButton.textContent = 'Auto-scroll: ' + (this.autoScroll ? 'ON' : 'OFF');
                this.autoScrollButton.className = 'px-4 py-2 text-white rounded-lg transition-colors ' + (
                    this.autoScroll ? 'bg-claude-blue hover:bg-blue-600' : 'bg-gray-500 hover:bg-gray-600'
                );
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

            hasRawJson(log) {
                return log.type === 'loop_start_marker' ||
                       (log.type === 'system' && log.subtype === 'init') ||
                       (log.type === 'result' && log.subtype === 'success') ||
                       log.type === 'loop_end_summary' ||
                       log.type === 'loop_all_completed' ||
                       (log.type === 'assistant' && log.message?.content);
            }

            showRawJsonModal(index) {
                // Find the log entry
                const log = this.filteredLogs[index];
                if (!log) return;

                // Create a modal overlay
                const overlay = document.createElement('div');
                overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
                overlay.onclick = (e) => {
                    if (e.target === overlay) {
                        document.body.removeChild(overlay);
                    }
                };

                const modal = document.createElement('div');
                modal.className = 'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 max-w-4xl max-h-96 overflow-y-auto m-4';

                const formattedContent = this.formatLogContent(log);

                modal.innerHTML =
                    '<div class="flex items-center justify-between mb-4">' +
                        '<h3 class="text-lg font-semibold">Raw JSON - ' + log.type + ' (#' + (index + 1) + ')</h3>' +
                        '<button onclick="this.closest(\\'.fixed\\').remove()" class="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>' +
                    '</div>' +
                    '<pre class="text-sm whitespace-pre-wrap break-words bg-gray-50 dark:bg-gray-700 p-4 rounded">' + formattedContent + '</pre>';

                overlay.appendChild(modal);
                document.body.appendChild(overlay);
            }

            expandStreamEvent(index) {
                // Find the stream event in filtered logs
                const log = this.filteredLogs[index];
                if (!log || log.type !== 'stream_event') return;

                // Create a modal-like overlay to show the stream event details
                const overlay = document.createElement('div');
                overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
                overlay.onclick = (e) => {
                    if (e.target === overlay) {
                        document.body.removeChild(overlay);
                    }
                };

                const modal = document.createElement('div');
                modal.className = 'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 max-w-2xl max-h-96 overflow-y-auto m-4';

                const eventType = log.event?.type || 'unknown';
                const formattedContent = this.formatLogContent(log);

                modal.innerHTML =
                    '<div class="flex items-center justify-between mb-4">' +
                        '<h3 class="text-lg font-semibold">Stream Event: ' + eventType + '</h3>' +
                        '<button onclick="this.closest(\\'.fixed\\').remove()" class="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>' +
                    '</div>' +
                    '<pre class="text-sm whitespace-pre-wrap break-words bg-gray-50 dark:bg-gray-700 p-4 rounded">' + formattedContent + '</pre>';

                overlay.appendChild(modal);
                document.body.appendChild(overlay);
            }

            expandUserMessage(index) {
                // Find the user message in filtered logs
                const log = this.filteredLogs[index];
                if (!log || log.type !== 'user') return;

                // Create a modal-like overlay to show the user message details
                const overlay = document.createElement('div');
                overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
                overlay.onclick = (e) => {
                    if (e.target === overlay) {
                        document.body.removeChild(overlay);
                    }
                };

                const modal = document.createElement('div');
                modal.className = 'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 max-w-2xl max-h-96 overflow-y-auto m-4';

                const formattedContent = this.formatLogContent(log);

                modal.innerHTML =
                    '<div class="flex items-center justify-between mb-4">' +
                        '<h3 class="text-lg font-semibold">User Message</h3>' +
                        '<button onclick="this.closest(\\'.fixed\\').remove()" class="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>' +
                    '</div>' +
                    '<pre class="text-sm whitespace-pre-wrap break-words bg-gray-50 dark:bg-gray-700 p-4 rounded">' + formattedContent + '</pre>';

                overlay.appendChild(modal);
                document.body.appendChild(overlay);
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

        // Send existing log entries first (last 1000 lines for performance)
        if (fs.existsSync(LOG_FILE)) {
            const logContent = fs.readFileSync(LOG_FILE, 'utf8');
            const allLines = logContent.split('\n').filter(line => line.trim());

            // Only load the last 1000 lines if there are more than 1000 lines
            const MAX_INITIAL_LINES = 1000;
            const lines = allLines.length > MAX_INITIAL_LINES
                ? allLines.slice(-MAX_INITIAL_LINES)
                : allLines;

            console.log(`Loading ${lines.length} of ${allLines.length} total log lines for client`);
            let validLines = 0;

            lines.forEach((line, index) => {
                // Skip the first line if it's just "-n"
                if (index === 0 && line.trim() === '-n') {
                    return;
                }

                try {
                    const logEntry = JSON.parse(line);
                    connection.send(JSON.stringify(logEntry));
                    validLines++;
                } catch (err) {
                    console.log(`Skipping invalid JSON line ${index + 1}: ${err.message}`);
                    console.log(`Line content: ${line.substring(0, 100)}...`);
                }
            });

            console.log(`Sent ${validLines} valid log entries to client`);
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
                                connection.send(JSON.stringify(logEntry));
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

        connection.on('close', () => {
            console.log('Client disconnected');
            fs.unwatchFile(LOG_FILE);
        });
    });
});

// Start the server
const start = async () => {
    try {
        await fastify.listen({ port: PORT, host: '0.0.0.0' });
        console.log('');
        console.log('🚀 Claude Code CLI Log Viewer running at:');
        console.log('   http://localhost:' + PORT);
        console.log('');
        console.log('📁 Watching log file: ' + LOG_FILE);
        console.log('');

        // Check if log file exists
        if (!fs.existsSync(LOG_FILE)) {
            console.log('⚠️  Log file doesn\'t exist yet. It will be created when Claude Code CLI starts logging.');
        } else {
            const stats = fs.statSync(LOG_FILE);
            console.log('📊 Log file size: ' + (stats.size / 1024).toFixed(2) + ' KB');
        }
        console.log('');
    } catch (err) {
        if (err.code === 'EADDRINUSE') {
            console.log('');
            console.log('❌ Port ' + PORT + ' is already in use!');
            console.log('');
            console.log('The log viewer is likely already running at:');
            console.log('   http://localhost:' + PORT);
            console.log('');
            console.log('To stop the existing server:');
            console.log('   1. Press Ctrl+C in the terminal where it\'s running');
            console.log('   2. Or run: pkill -f "node.*viewer.js"');
            console.log('   3. Then restart this script');
            console.log('');
        } else {
            console.log('❌ Failed to start server:');
            console.log(err.message);
        }
        process.exit(1);
    }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down log viewer...');
    await fastify.close();
    process.exit(0);
});

start();