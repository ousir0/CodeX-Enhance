(() => {
  const helperBase = window.__CODEX_SESSION_DELETE_HELPER__ || "http://127.0.0.1:57321";
  const buttonClass = "codex-delete-button";
  const exportButtonClass = "codex-export-button";
  const projectMoveButtonClass = "codex-project-move-button";
  const projectMoveOverlayClass = "codex-project-move-overlay";
  const actionButtonClass = "codex-session-action-button";
  const actionGroupClass = "codex-session-actions";
  const timelineClass = "codex-conversation-timeline";
  const timelineTrackClass = "codex-conversation-timeline-track";
  const timelineMarkerClass = "codex-conversation-timeline-marker";
  const timelineTooltipClass = "codex-conversation-timeline-tooltip";
  const timelineTargetClass = "codex-conversation-timeline-target";
  const timelineQuestionLimit = 40;
  const timelineMinTopPercent = 2;
  const timelineMaxTopPercent = 98;
  const timelineMaxMarkerGapPercent = 3.5;
  const projectMoveProjectionKey = "codexProjectMoveProjection";
  const legacyProjectMoveOverridesKey = "codexProjectMoveOverrides";
  const projectMoveProjectionTtlMs = 24 * 60 * 60 * 1000;
  const projectMoveProjectionSettleMs = 5 * 60 * 1000;
  const projectMoveRefreshDelaysMs = [50, 250, 750, 1500];
  const chatsSortRefreshIntervalMs = 1500;
  const chatsSortDbRefreshIntervalMs = 5000;
  const styleId = "codex-delete-style";
  const codexDeleteStyleVersion = "10";
  const codexPlusMenuId = "codex-plus-menu";
  const codexPlusMenuFloatingClass = "codex-plus-menu-floating";
  const codexPlusComposerId = "codex-plus-composer-tools";
  const codexPlusActionsMenuClass = "codex-plus-actions-menu";
  const codexDeleteVersion = "6";
  const codexExportVersion = "1";
  const codexProjectMoveVersion = "1";
  const codexActionGroupVersion = "2";
  const codexArchiveRowActionsVersion = "1";
  const codexArchiveDeleteAllVersion = "2";
  const codexConversationTimelineVersion = "2";
  const codexPlusVersion = "1.0.8";
  const codexPlusProductName = "CodeX 增强";
  const codexPlusProductSubtitle = "Codex 桌面增强工具";
  const codexUnlockPluginName = "Codex 插件解锁";
  const codexPlusMenuLabel = `${codexPlusProductName} ${codexPlusVersion}`;
  const codexPlusSettingsKey = "codexPlusSettings";
  window.__codexProjectMoveRuntimeId = (window.__codexProjectMoveRuntimeId || 0) + 1;
  const codexProjectMoveRuntimeId = window.__codexProjectMoveRuntimeId;
  clearTimeout(window.__codexProjectMoveProjectionTimer);
  clearTimeout(window.__codexProjectMoveChatsSortTimer);
  window.__codexProjectMoveProjectionTimer = null;
  window.__codexProjectMoveChatsSortTimer = null;
  window.__codexConversationTimelineNodeCounter = window.__codexConversationTimelineNodeCounter || 0;
  const selectors = {
    sidebarThread: "[data-app-action-sidebar-thread-id]",
    threadTitle: "[data-thread-title]",
    appHeader: ".app-header-tint",
    nativeMenuBar: ".flex.items-center.gap-0\\.5, [class*=\"flex items-center gap-0.5\"]",
    archiveNav: 'button[aria-label="已归档对话"], button[aria-label="Archived conversations"]',
    disabledInstallButton: 'button:disabled.w-full.justify-center, [role="button"][aria-disabled="true"].cursor-not-allowed',
    pluginNavButton: 'nav[role="navigation"] button.h-token-nav-row.w-full',
    pluginSvgPath: 'svg path[d^="M7.94562 14.0277"]',
  };

  function installStyle() {
    const existingStyle = document.getElementById(styleId);
    if (existingStyle?.dataset.codexDeleteStyleVersion === codexDeleteStyleVersion) return;
    existingStyle?.remove();
    const style = document.createElement("style");
    style.id = styleId;
    style.dataset.codexDeleteStyleVersion = codexDeleteStyleVersion;
    style.textContent = `
      .${actionGroupClass} {
        position: absolute;
        right: 28px;
        top: 50%;
        transform: translateY(-50%);
        z-index: 20;
        opacity: 0;
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      .${actionButtonClass},
      .codex-archive-row-button {
        border: 1px solid #ef4444;
        border-radius: 6px;
        background: #f3f4f6;
        color: #374151;
        font-size: 12px;
        line-height: 16px;
        padding: 1px 6px;
        cursor: pointer;
      }
      .codex-archive-row-button {
        border-radius: 7px;
        font: 12px system-ui, sans-serif;
        line-height: 16px;
        padding: 3px 8px;
      }
      .${buttonClass},
      .codex-archive-row-button.${buttonClass} {
        border-color: #ef4444;
        background: #fee2e2;
        color: #991b1b;
      }
      .${exportButtonClass},
      .codex-archive-row-button.${exportButtonClass} {
        border-color: #93c5fd;
        background: #dbeafe;
        color: #1d4ed8;
      }
      .${projectMoveButtonClass} {
        border-color: #10a37f;
        background: #d1fae5;
        color: #065f46;
      }
      [data-codex-delete-row="true"]:hover .${actionGroupClass} { opacity: 1; }
      [data-codex-delete-row="true"].codex-archive-confirm-visible .${actionGroupClass} { right: 66px; }
      .${projectMoveOverlayClass} {
        position: fixed;
        inset: 0;
        z-index: 2147483200;
        background: rgba(15,23,42,.28);
      }
      .codex-project-move-panel {
        position: fixed;
        width: min(360px, calc(100vw - 32px));
        max-height: min(520px, calc(100vh - 32px));
        overflow: hidden;
        border: 1px solid rgba(15,23,42,.14);
        border-radius: 10px;
        background: #ffffff;
        color: #111827;
        font: 13px system-ui, sans-serif;
        box-shadow: 0 18px 60px rgba(15,23,42,.25);
      }
      .codex-project-move-header { border-bottom: 1px solid #e5e7eb; padding: 10px 12px; }
      .codex-project-move-title { font-weight: 650; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .codex-project-move-list { max-height: min(440px, calc(100vh - 110px)); overflow-y: auto; padding: 6px; }
      .codex-project-move-item {
        display: block;
        width: 100%;
        border: 0;
        border-radius: 7px;
        background: transparent;
        color: #111827;
        padding: 8px 9px;
        text-align: left;
        cursor: pointer;
      }
      .codex-project-move-item:hover,
      .codex-project-move-item:focus-visible { background: #f3f4f6; outline: none; }
      .codex-project-move-item-title { font-weight: 550; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .codex-project-move-item-path { margin-top: 2px; color: #6b7280; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .codex-project-move-empty { padding: 18px 12px; color: #6b7280; text-align: center; }
      .codex-project-move-hidden { display: none !important; }
      [data-codex-project-move-injected-list="true"] { display: flex; flex-direction: column; }
      .codex-archive-delete-all {
        border: 1px solid #ef4444;
        border-radius: 7px;
        background: #fee2e2;
        color: #991b1b;
        font: 12px system-ui, sans-serif;
        line-height: 16px;
        padding: 3px 8px;
        cursor: pointer;
      }
      .codex-archive-action-bar {
        position: fixed;
        right: 28px;
        top: 86px;
        z-index: 2147482999;
        box-shadow: 0 8px 24px rgba(0,0,0,.18);
      }
      .codex-delete-toast {
        position: fixed;
        right: 18px;
        bottom: 18px;
        z-index: 2147483000;
        padding: 10px 12px;
        border-radius: 8px;
        background: #111827;
        color: white;
        font: 13px system-ui, sans-serif;
        box-shadow: 0 8px 30px rgba(0,0,0,.25);
        pointer-events: none;
      }
      .codex-delete-toast button { margin-left: 10px; pointer-events: auto; }
      .codex-delete-confirm-overlay {
        position: fixed;
        inset: 0;
        z-index: 2147483200;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(15,23,42,.28);
      }
      .codex-delete-confirm-content {
        width: min(420px, calc(100vw - 48px));
        border: 1px solid rgba(15,23,42,.12);
        border-radius: 12px;
        background: #ffffff;
        color: #111827;
        font: 14px system-ui, sans-serif;
        box-shadow: 0 24px 80px rgba(15,23,42,.22);
        padding: 18px;
      }
      .codex-delete-confirm-title { font-size: 16px; font-weight: 650; }
      .codex-delete-confirm-message { margin-top: 8px; color: #4b5563; line-height: 1.45; }
      .codex-delete-confirm-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 18px;
      }
      .codex-delete-confirm-actions button {
        border: 1px solid #d1d5db;
        border-radius: 7px;
        padding: 6px 12px;
        background: #ffffff;
        color: #111827;
        font: 13px system-ui, sans-serif;
        cursor: pointer;
      }
      .codex-delete-confirm-actions [data-codex-delete-confirm="true"] {
        border-color: #ef4444;
        background: #dc2626;
        color: #ffffff;
      }
      .codex-export-name-input {
        width: 100%;
        box-sizing: border-box;
        margin-top: 12px;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        background: #ffffff;
        color: #111827;
        font: 13px system-ui, sans-serif;
        line-height: 18px;
        padding: 8px 10px;
        outline: none;
      }
      .codex-export-name-input:focus {
        border-color: #9ca3af;
        box-shadow: 0 0 0 3px rgba(17, 24, 39, .08);
      }
      .codex-export-directory-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 10px;
      }
      .codex-export-directory-row .codex-export-name-input {
        margin-top: 0;
      }
      .codex-export-directory-button {
        flex: 0 0 auto;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        background: #ffffff;
        color: #374151;
        font: 13px system-ui, sans-serif;
        line-height: 18px;
        padding: 8px 10px;
        cursor: pointer;
      }
      .codex-export-directory-button:hover,
      .codex-export-directory-button:focus-visible {
        background: #f3f4f6;
        outline: none;
      }
      #${codexPlusMenuId}.${codexPlusMenuFloatingClass} {
        position: fixed;
        top: var(--codex-plus-menu-top, 0);
        right: var(--codex-plus-menu-right, 140px);
        left: auto;
        z-index: 2147483645;
        height: var(--codex-plus-menu-height, 30px);
        color: #d1d5db;
        font: 13px system-ui, sans-serif;
        text-align: right;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        pointer-events: auto;
        -webkit-app-region: no-drag;
      }
      #${codexPlusMenuId} {
        display: inline-flex;
        align-items: center;
        height: 100%;
        flex: 0 0 auto;
        pointer-events: auto;
        -webkit-app-region: no-drag;
      }
      .codex-plus-trigger {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        border: 0;
        background: transparent;
        color: inherit;
        font: inherit;
        height: 100%;
        line-height: 1;
        padding: 0 8px;
        cursor: pointer;
        pointer-events: auto;
        -webkit-app-region: no-drag;
      }
      #${codexPlusComposerId} {
        width: min(100%, 760px);
        margin: 0 auto 8px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        color: var(--text-primary, #171717);
        font: 13px system-ui, sans-serif;
        pointer-events: auto;
      }
      .codex-plus-composer-status {
        display: inline-flex;
        align-items: center;
        min-width: 0;
        gap: 8px;
        color: var(--text-secondary, #5f5f5f);
        line-height: 20px;
        border: 0;
        background: transparent;
        padding: 0;
        cursor: pointer;
      }
      .codex-plus-composer-status:hover,
      .codex-plus-composer-status:focus-visible {
        color: var(--text-primary, #171717);
        outline: none;
      }
      .codex-plus-composer-status-text {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .codex-plus-online-dot {
        width: 7px;
        height: 7px;
        flex: 0 0 auto;
        border-radius: 999px;
        background: #10a37f;
        box-shadow: 0 0 0 2px rgba(16, 163, 127, .14);
      }
      .codex-plus-composer-more {
        width: 28px;
        height: 28px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex: 0 0 auto;
        border: 1px solid color-mix(in srgb, currentColor 12%, transparent);
        border-radius: 7px;
        background: color-mix(in srgb, currentColor 3%, transparent);
        color: var(--text-secondary, #5f5f5f);
        font: 18px/1 system-ui, sans-serif;
        cursor: pointer;
      }
      .codex-plus-composer-more:hover,
      .codex-plus-composer-more:focus-visible {
        background: color-mix(in srgb, currentColor 7%, transparent);
        color: var(--text-primary, #171717);
        outline: none;
      }
      .${codexPlusActionsMenuClass} {
        position: fixed;
        z-index: 2147483646;
        min-width: 168px;
        padding: 5px;
        border: 1px solid rgba(0, 0, 0, .10);
        border-radius: 10px;
        background: #ffffff;
        color: #171717;
        font: 13px system-ui, sans-serif;
        box-shadow: 0 18px 48px rgba(0, 0, 0, .14), 0 2px 8px rgba(0, 0, 0, .08);
        pointer-events: auto;
      }
      .codex-plus-actions-menu-item {
        width: 100%;
        min-height: 32px;
        display: flex;
        align-items: center;
        gap: 9px;
        border: 0;
        border-radius: 7px;
        background: transparent;
        color: inherit;
        font: inherit;
        text-align: left;
        padding: 6px 8px;
        cursor: pointer;
      }
      .codex-plus-actions-menu-item:hover,
      .codex-plus-actions-menu-item:focus-visible {
        background: #f4f4f4;
        outline: none;
      }
      .codex-plus-actions-menu-icon {
        width: 16px;
        flex: 0 0 16px;
        color: #6b6b6b;
        text-align: center;
      }
      .codex-plus-modal-overlay {
        position: fixed;
        inset: 0;
        z-index: 2147483646;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, .16);
        pointer-events: auto;
        -webkit-app-region: no-drag;
      }
      .codex-plus-modal-content {
        --codex-plus-bg: var(--token-main-surface-primary, var(--bg-primary, #ffffff));
        --codex-plus-sidebar-bg: var(--token-main-surface-secondary, #f7f7f7);
        --codex-plus-hover-bg: var(--token-main-surface-tertiary, #f2f2f2);
        --codex-plus-border: var(--border-light, rgba(0, 0, 0, .10));
        --codex-plus-text: var(--text-primary, #171717);
        --codex-plus-muted: var(--text-secondary, #5f5f5f);
        --codex-plus-control: var(--token-main-surface-primary, #ffffff);
        width: min(760px, calc(100vw - 48px));
        height: min(680px, calc(100vh - 40px));
        display: flex;
        flex-direction: column;
        overflow: hidden;
        border: 1px solid var(--codex-plus-border);
        border-radius: 12px;
        background: var(--codex-plus-bg);
        color: var(--codex-plus-text);
        font: 14px system-ui, sans-serif;
        box-shadow: 0 18px 70px rgba(0, 0, 0, .16), 0 2px 10px rgba(0, 0, 0, .08);
        pointer-events: auto;
        -webkit-app-region: no-drag;
      }
      .codex-plus-modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-height: 56px;
        padding: 10px 14px 10px 16px;
        border-bottom: 1px solid var(--codex-plus-border);
        flex: 0 0 auto;
        -webkit-app-region: no-drag;
      }
      .codex-plus-modal-title { display: flex; align-items: center; gap: 9px; min-width: 0; }
      .codex-plus-modal-title-main { font-size: 15px; font-weight: 650; line-height: 20px; }
      .codex-plus-modal-subtitle { margin-top: 1px; color: var(--codex-plus-muted); font-size: 12px; line-height: 16px; }
      .codex-plus-backend-indicator { width: 9px; height: 9px; border-radius: 999px; background: #a1a1aa; display: inline-block; }
      .codex-plus-backend-indicator[data-status="ok"] { background: #10a37f; box-shadow: 0 0 0 3px rgba(16, 163, 127, .12); }
      .codex-plus-backend-indicator[data-status="failed"] { background: #ef4444; box-shadow: 0 0 0 3px rgba(239, 68, 68, .12); }
      .codex-plus-backend-indicator[data-status="checking"] { background: #fbbf24; }
      .codex-plus-modal-close {
        width: 28px;
        height: 28px;
        border: 1px solid transparent;
        border-radius: 6px;
        background: transparent;
        color: var(--codex-plus-muted);
        font-size: 20px;
        line-height: 1;
        cursor: pointer;
        pointer-events: auto;
        -webkit-app-region: no-drag;
      }
      .codex-plus-modal-close:hover { background: var(--codex-plus-hover-bg); color: var(--codex-plus-text); }
      .codex-plus-modal-shell {
        display: grid;
        grid-template-columns: 154px minmax(0, 1fr);
        flex: 1 1 auto;
        min-height: 0;
      }
      .codex-plus-modal-body {
        flex: 1 1 auto;
        min-height: 0;
        overflow-y: auto;
        overscroll-behavior: contain;
        scrollbar-gutter: stable;
        padding: 8px 18px 18px;
        scrollbar-width: thin;
        scrollbar-color: rgba(0,0,0,.24) transparent;
      }
      .codex-plus-modal-body::-webkit-scrollbar { width: 10px; }
      .codex-plus-modal-body::-webkit-scrollbar-track { background: transparent; }
      .codex-plus-modal-body::-webkit-scrollbar-thumb {
        border: 2px solid transparent;
        border-radius: 999px;
        background: rgba(0,0,0,.22);
        background-clip: padding-box;
      }
      .codex-plus-modal-body::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,.34); background-clip: padding-box; }
      .codex-plus-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: flex-start;
        gap: 16px;
        padding: 12px 0;
        border-top: 1px solid var(--codex-plus-border);
      }
      .codex-plus-row:first-child { border-top: 0; }
      .codex-plus-row-title { color: var(--codex-plus-text); font-size: 13px; font-weight: 540; line-height: 18px; }
      .codex-plus-row-description { margin-top: 3px; color: var(--codex-plus-muted); font-size: 12px; line-height: 17px; }
      .codex-plus-toggle {
        width: 38px;
        height: 22px;
        border: 0;
        border-radius: 999px;
        background: #d9d9d9;
        padding: 2px;
        cursor: pointer;
      }
      .codex-plus-toggle span {
        display: block;
        width: 18px;
        height: 18px;
        border-radius: 999px;
        background: #ffffff;
        box-shadow: 0 1px 2px rgba(0, 0, 0, .18);
        transition: transform .12s ease;
      }
      .codex-plus-toggle,
      .codex-plus-action-button,
      .codex-plus-backend-status {
        flex-shrink: 0;
        align-self: center;
      }
      .codex-plus-toggle[data-enabled="true"] { background: #10a37f; }
      .codex-plus-toggle[data-enabled="true"] span { transform: translateX(16px); }
      .codex-plus-about { color: var(--codex-plus-muted); font-size: 12px; line-height: 18px; }
      .codex-plus-tabs {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-height: 0;
        padding: 10px 8px;
        border-right: 1px solid var(--codex-plus-border);
        background: var(--codex-plus-sidebar-bg);
      }
      .codex-plus-tabs-main {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .codex-plus-tab-button {
        width: 100%;
        min-height: 32px;
        border: 0;
        border-radius: 7px;
        background: transparent;
        color: var(--codex-plus-muted);
        font: 13px system-ui, sans-serif;
        text-align: left;
        padding: 6px 9px;
        cursor: pointer;
      }
      .codex-plus-tab-button:hover { background: var(--codex-plus-hover-bg); color: var(--codex-plus-text); }
      .codex-plus-tab-button[data-active="true"] { background: var(--codex-plus-bg); color: var(--codex-plus-text); box-shadow: inset 0 0 0 1px var(--codex-plus-border); }
      .codex-plus-nav-recommendation {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        margin-top: auto;
        border-radius: 7px;
        color: #9b9b9b;
        font: 12px system-ui, sans-serif;
        line-height: 16px;
        text-decoration: none;
        padding: 7px 9px;
      }
      .codex-plus-nav-recommendation svg {
        width: 14px;
        height: 14px;
        flex: 0 0 auto;
        stroke: currentColor;
      }
      .codex-plus-nav-recommendation:hover,
      .codex-plus-nav-recommendation:focus-visible {
        background: var(--codex-plus-hover-bg);
        color: #6f6f6f;
        outline: none;
      }
      .codex-plus-panel[hidden] { display: none; }
      .codex-plus-action-button {
        border: 1px solid var(--codex-plus-border);
        border-radius: 7px;
        background: var(--codex-plus-control);
        color: var(--codex-plus-text);
        font: 12px system-ui, sans-serif;
        padding: 6px 9px;
        cursor: pointer;
      }
      .codex-plus-action-button:hover { background: var(--codex-plus-hover-bg); }
      .codex-plus-backend-status { display: grid; gap: 4px; min-width: 132px; justify-items: end; }
      .codex-plus-backend-label { color: var(--codex-plus-muted); font-size: 12px; }
      .codex-plus-backend-label[data-status="ok"] { color: #0d8f70; }
      .codex-plus-backend-label[data-status="failed"] { color: #dc2626; }
      .codex-plus-backend-repair { border: 1px solid var(--codex-plus-border); border-radius: 7px; background: var(--codex-plus-control); color: var(--codex-plus-text); font: 12px system-ui, sans-serif; padding: 6px 9px; cursor: pointer; }
      .codex-plus-backend-repair[hidden] { display: none; }
      .codex-plus-text-input {
        width: min(320px, 100%);
        margin-top: 6px;
        border: 1px solid var(--codex-plus-border);
        border-radius: 7px;
        background: var(--codex-plus-control);
        color: var(--codex-plus-text);
        font: 12px system-ui, sans-serif;
        padding: 7px 8px;
        outline: none;
      }
      .codex-plus-text-input:focus { border-color: #10a37f; box-shadow: 0 0 0 2px rgba(16,163,127,.18); }
      .codex-plus-text-input::placeholder { color: #9ca3af; }
      .codex-plus-inline-warning { margin-top: 4px; color: #a16207; font-size: 12px; }
      .codex-plus-row-actions { display: grid; justify-items: end; gap: 8px; min-width: 120px; }
      .codex-plus-secondary-button { border: 1px solid var(--codex-plus-border); border-radius: 7px; background: var(--codex-plus-control); color: var(--codex-plus-text); font: 12px system-ui, sans-serif; padding: 6px 9px; cursor: pointer; }
      @media (max-width: 640px) {
        .codex-plus-modal-content { width: calc(100vw - 24px); height: min(720px, calc(100vh - 24px)); }
        .codex-plus-modal-shell { grid-template-columns: 1fr; }
        .codex-plus-tabs {
          flex-direction: row;
          overflow-x: auto;
          border-right: 0;
          border-bottom: 1px solid var(--codex-plus-border);
        }
        .codex-plus-tabs-main { flex-direction: row; flex: 0 0 auto; }
        .codex-plus-nav-recommendation { margin-top: 0; white-space: nowrap; }
        .codex-plus-tab-button { width: auto; white-space: nowrap; }
        .codex-plus-row { grid-template-columns: 1fr; }
        .codex-plus-toggle,
        .codex-plus-action-button,
        .codex-plus-backend-status { justify-self: start; align-self: start; }
      }
      .${timelineClass} {
        position: fixed;
        top: var(--codex-conversation-timeline-top, 84px);
        left: var(--codex-conversation-timeline-left, auto);
        right: auto;
        height: var(--codex-conversation-timeline-height, calc(100vh - 124px));
        width: 24px;
        z-index: 2147482500;
        pointer-events: none;
      }
      .${timelineTrackClass} {
        position: absolute;
        top: 0;
        bottom: 0;
        left: 50%;
        width: 2px;
        transform: translateX(-50%);
        border-radius: 999px;
        background: rgba(209, 213, 219, .55);
      }
      .${timelineMarkerClass} {
        position: absolute;
        left: 50%;
        width: 12px;
        height: 12px;
        border: 0;
        border-radius: 999px;
        transform: translate(-50%, -50%);
        background: #d1d5db;
        cursor: pointer;
        pointer-events: auto;
        box-shadow: 0 0 0 2px rgba(255, 255, 255, .92);
      }
      .${timelineMarkerClass}:hover,
      .${timelineMarkerClass}:focus-visible {
        background: #737373;
        outline: none;
      }
      .${timelineMarkerClass}.codex-conversation-timeline-marker-active {
        background: #171717;
        box-shadow: 0 0 0 3px rgba(23, 23, 23, .12);
      }
      .${timelineTooltipClass} {
        position: absolute;
        right: 20px;
        top: 50%;
        display: block;
        box-sizing: border-box;
        width: max-content;
        max-width: min(320px, calc(100vw - 72px));
        transform: translateY(-50%);
        border-radius: 8px;
        background: rgba(80, 80, 80, .92);
        color: #ffffff;
        font: 600 13px system-ui, sans-serif;
        line-height: 18px;
        padding: 10px 12px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        box-shadow: 0 8px 24px rgba(0, 0, 0, .18);
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
      }
      .${timelineMarkerClass}:hover .${timelineTooltipClass},
      .${timelineMarkerClass}:focus-visible .${timelineTooltipClass} {
        opacity: 1;
        visibility: visible;
        z-index: 2147482501;
      }
      .${timelineTargetClass} {
        animation: codex-conversation-timeline-pulse 1.2s ease-out;
      }
      @keyframes codex-conversation-timeline-pulse {
        0% { box-shadow: 0 0 0 0 rgba(16, 163, 127, .35); }
        100% { box-shadow: 0 0 0 14px rgba(16, 163, 127, 0); }
      }
    `;
    document.documentElement.appendChild(style);
  }

  function defaultCodexPlusSettings() {
    return { pluginEntryUnlock: true, forcePluginInstall: true, sessionDelete: false, markdownExport: true, projectMove: true, conversationTimeline: true, nativeMenuPlacement: false };
  }

  function codexPlusSettings() {
    try {
      return { ...defaultCodexPlusSettings(), ...JSON.parse(localStorage.getItem(codexPlusSettingsKey) || "{}") };
    } catch {
      return defaultCodexPlusSettings();
    }
  }

  function setCodexPlusSetting(key, value) {
    const next = { ...codexPlusSettings(), [key]: value };
    localStorage.setItem(codexPlusSettingsKey, JSON.stringify(next));
    renderCodexPlusMenu();
    scan();
  }

  function renderCodexPlusMenu() {
    document.querySelectorAll(".codex-plus-toggle[data-codex-plus-setting]").forEach((button) => {
      const key = button.getAttribute("data-codex-plus-setting");
      button.dataset.enabled = String(!!codexPlusSettings()[key]);
    });
  }

  let codexPlusBackendSettings = { providerSyncEnabled: false, skipLoginEnabled: true, exportDirectory: "" };

  async function loadBackendSettings() {
    try {
      const settings = await postJson("/settings/get", {});
      codexPlusBackendSettings = { ...codexPlusBackendSettings, ...settings };
      refreshCodexPlusBackendControls();
    } catch (_) {
      refreshCodexPlusBackendControls();
    }
  }

  async function setBackendSetting(key, value) {
    codexPlusBackendSettings = { ...codexPlusBackendSettings, [key]: value };
    refreshCodexPlusBackendControls();
    try {
      const settings = await postJson("/settings/set", { [key]: value });
      codexPlusBackendSettings = { ...codexPlusBackendSettings, ...settings };
    } finally {
      refreshCodexPlusBackendControls();
    }
  }

  function refreshCodexPlusBackendControls() {
    document.querySelectorAll(".codex-plus-toggle[data-codex-backend-setting]").forEach((button) => {
      const key = button.getAttribute("data-codex-backend-setting");
      button.dataset.enabled = String(!!codexPlusBackendSettings[key]);
    });
    document.querySelectorAll("[data-codex-backend-setting-input]").forEach((input) => {
      const key = input.getAttribute("data-codex-backend-setting-input");
      if (document.activeElement !== input) input.value = codexPlusBackendSettings[key] || "";
    });
  }

  let codexPlusBackendStatus = { status: "checking", message: "正在检查后端…" };
  let codexPlusRelayStatus = { configured: false, authenticated: false, configPath: "", accountLabel: "", message: "" };
  function renderBackendStatus() {
    const status = codexPlusBackendStatus.status || "failed";
    const label = document.querySelector("[data-codex-backend-status]");
    if (label) {
      label.dataset.status = status;
      label.textContent = codexPlusBackendStatus.message || (status === "ok" ? "后端已连接" : "后端已断开");
    }
    document.querySelectorAll("[data-codex-backend-indicator]").forEach((indicator) => {
      indicator.dataset.status = status;
      indicator.title = status === "ok" ? "后端已连接" : status === "checking" ? "正在检查后端" : "后端已断开";
    });
    document.querySelectorAll("[data-codex-composer-reconnect]").forEach((button) => {
      button.title = status === "ok" ? "后端已连接，点击可重新连接" : status === "checking" ? "正在连接 CodeX 增强" : "后端已断开，点击重连";
      button.setAttribute("aria-label", button.title);
      const text = button.querySelector(".codex-plus-composer-status-text");
      if (text) text.textContent = status === "failed" ? `${codexPlusMenuLabel} · 点击重连` : codexPlusMenuLabel;
    });
    const repair = document.querySelector("[data-codex-backend-repair]");
    if (repair) repair.hidden = status === "ok" || status === "checking";
  }

  function withBackendTimeout(request) {
    return Promise.race([
      request,
      new Promise((resolve) => setTimeout(() => resolve({ status: "failed", message: "后端已断开" }), 2000)),
    ]);
  }

  async function checkBackendStatus() {
    codexPlusBackendStatus = await withBackendTimeout(postJson("/backend/status", {}));
    renderBackendStatus();
  }

  async function repairBackend() {
    codexPlusBackendStatus = { status: "checking", message: "正在修复后端…" };
    renderBackendStatus();
    try {
      codexPlusBackendStatus = await httpPostJson("/backend/repair", {});
    } catch (error) {
      codexPlusBackendStatus = { status: "failed", message: "后端修复失败" };
    }
    renderBackendStatus();
  }

  function scheduleBackendHeartbeat() {
    clearInterval(window.__codexPlusBackendHeartbeat);
    window.__codexPlusBackendHeartbeat = setInterval(checkBackendStatus, 5000);
    checkBackendStatus();
  }

  function renderRelayStatus() {
    const status = document.querySelector("[data-codex-relay-status]");
    if (status) {
      status.dataset.status = codexPlusRelayStatus.configured ? "ok" : "failed";
      status.textContent = codexPlusRelayStatus.configured ? "apikey 已配置" : "apikey 未配置";
    }
    const auth = document.querySelector("[data-codex-relay-auth]");
    if (auth) auth.textContent = "增强启动时会跳过 ChatGPT 登录。";
    const path = document.querySelector("[data-codex-relay-config-path]");
    if (path) path.textContent = codexPlusRelayStatus.configPath || "~/.codex/config.toml";
    const message = document.querySelector("[data-codex-relay-message]");
    if (message) message.textContent = codexPlusRelayStatus.message || "";
  }

  async function loadRelayStatus() {
    try {
      codexPlusRelayStatus = { ...codexPlusRelayStatus, ...(await postJson("/relay/status", {})) };
    } catch (_) {
      codexPlusRelayStatus = { ...codexPlusRelayStatus, message: "读取 apikey 状态失败" };
    }
    renderRelayStatus();
  }

  async function applyRelayConfig() {
    const baseUrl = document.querySelector("[data-codex-relay-base-url]")?.value || "";
    const apiKey = document.querySelector("[data-codex-relay-api-key]")?.value || "";
    codexPlusRelayStatus = { ...codexPlusRelayStatus, message: "正在保存 apikey 配置…" };
    renderRelayStatus();
    try {
      const result = await postJson("/relay/apply", { base_url: baseUrl, api_key: apiKey });
      codexPlusRelayStatus = { ...codexPlusRelayStatus, ...result, message: result.message || "" };
      const keyInput = document.querySelector("[data-codex-relay-api-key]");
      if (result.status === "ok" && keyInput) keyInput.value = "";
      await loadRelayStatus();
    } catch (_) {
      codexPlusRelayStatus = { ...codexPlusRelayStatus, message: "保存 apikey 配置失败" };
      renderRelayStatus();
    }
  }

  async function clearRelayConfig() {
    codexPlusRelayStatus = { ...codexPlusRelayStatus, message: "正在清理 apikey 配置…" };
    renderRelayStatus();
    try {
      const result = await postJson("/relay/clear", {});
      codexPlusRelayStatus = { ...codexPlusRelayStatus, ...result, message: result.message || "" };
      await loadRelayStatus();
    } catch (_) {
      codexPlusRelayStatus = { ...codexPlusRelayStatus, message: "清理 apikey 配置失败" };
      renderRelayStatus();
    }
  }

  function selectCodexPlusTab(tab) {
    document.querySelectorAll(".codex-plus-modal-content").forEach((modal) => {
      modal.dataset.codexPlusActiveTab = tab;
    });
    document.querySelectorAll("[data-codex-plus-tab]").forEach((button) => {
      button.dataset.active = String(button.getAttribute("data-codex-plus-tab") === tab);
    });
    document.querySelectorAll("[data-codex-plus-panel]").forEach((panel) => {
      panel.hidden = panel.getAttribute("data-codex-plus-panel") !== tab;
    });
    if (tab === "relay") loadRelayStatus();
  }

  function openCodexPlusModal() {
    document.querySelectorAll(".codex-plus-modal-overlay").forEach((node) => node.remove());
    document.querySelectorAll('[data-codex-plus-dialog="true"]').forEach((node) => node.remove());
    const overlay = document.createElement("div");
    overlay.className = "codex-plus-modal-overlay";
    overlay.innerHTML = `
      <div class="codex-plus-modal-content" role="dialog" aria-modal="true" aria-label="${codexPlusProductName}">
        <div class="codex-plus-modal-header">
          <div class="codex-plus-modal-title">
            <span class="codex-plus-backend-indicator" data-codex-backend-indicator="true" data-status="checking"></span>
            <div>
              <div class="codex-plus-modal-title-main">${codexPlusProductName}</div>
              <div class="codex-plus-modal-subtitle">${codexPlusProductSubtitle} · ${codexPlusVersion}</div>
            </div>
          </div>
          <button type="button" class="codex-plus-modal-close" aria-label="关闭">×</button>
        </div>
        <div class="codex-plus-modal-shell">
          <div class="codex-plus-tabs">
            <div class="codex-plus-tabs-main" role="tablist" aria-label="${codexPlusProductName}">
              <button type="button" class="codex-plus-tab-button" data-codex-plus-tab="home" data-active="true">主页</button>
              <button type="button" class="codex-plus-tab-button" data-codex-plus-tab="relay" data-active="false">apikey</button>
            </div>
            <a class="codex-plus-nav-recommendation" href="https://osirclaw.com/" target="_blank" rel="noreferrer" aria-label="api中转推荐">
              <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M12 3v18"></path>
                <path d="M17 8H9.5a3.5 3.5 0 0 0 0 7H15a3 3 0 0 1 0 6H6"></path>
              </svg>
              <span>api中转推荐</span>
            </a>
          </div>
          <div class="codex-plus-modal-body">
          <div class="codex-plus-panel" data-codex-plus-panel="home">
            <div class="codex-plus-row">
              <div><div class="codex-plus-row-title">后端连接</div><div class="codex-plus-row-description">每 5 秒检查一次 launcher 后端状态；断开时可尝试修复后端运行。</div></div>
              <div class="codex-plus-backend-status">
                <div class="codex-plus-backend-label" data-codex-backend-status="true" data-status="checking">正在检查后端…</div>
                <button type="button" class="codex-plus-backend-repair" data-codex-backend-repair="true" hidden>修复后端运行</button>
              </div>
            </div>
            <div class="codex-plus-row">
              <div><div class="codex-plus-row-title">${codexUnlockPluginName}</div><div class="codex-plus-row-description">在 API Key 模式下显示并启用 Codex 插件入口。</div></div>
              <button type="button" class="codex-plus-toggle" data-codex-plus-setting="pluginEntryUnlock"><span></span></button>
            </div>
            <div class="codex-plus-row">
              <div>
                <div class="codex-plus-row-title">启动时跳过登录</div>
                <div class="codex-plus-row-description">使用 ${codexPlusProductName} 启动时跳过 ChatGPT 登录模式，按 API Key 模式启动。</div>
              </div>
              <div class="codex-plus-backend-status">
                <button type="button" class="codex-plus-toggle" data-codex-backend-setting="skipLoginEnabled"><span></span></button>
              </div>
            </div>
            <div class="codex-plus-row">
              <div><div class="codex-plus-row-title">插件安装解锁</div><div class="codex-plus-row-description">解除 App unavailable / 应用不可用导致的安装按钮禁用。</div></div>
              <button type="button" class="codex-plus-toggle" data-codex-plus-setting="forcePluginInstall"><span></span></button>
            </div>
            <div class="codex-plus-row">
              <div>
                <div class="codex-plus-row-title">Markdown 导出</div>
                <div class="codex-plus-row-description">导出当前会话为 .md 文件。</div>
              </div>
              <button type="button" class="codex-plus-toggle" data-codex-plus-setting="markdownExport"><span></span></button>
            </div>
            <div class="codex-plus-row">
              <div><div class="codex-plus-row-title">会话项目移动</div><div class="codex-plus-row-description">在输入区更多操作中移动当前会话到普通对话或其他本地项目。</div></div>
              <button type="button" class="codex-plus-toggle" data-codex-plus-setting="projectMove"><span></span></button>
            </div>
            <div class="codex-plus-row">
              <div><div class="codex-plus-row-title">对话 Timeline</div><div class="codex-plus-row-description">在对话右侧显示用户提问时间线，悬停查看摘要，点击跳转。</div></div>
              <button type="button" class="codex-plus-toggle" data-codex-plus-setting="conversationTimeline"><span></span></button>
            </div>
            <div class="codex-plus-row">
              <div><div class="codex-plus-row-title">Provider 同步</div><div class="codex-plus-row-description">切换供应商（model_provider）时不丢任何历史会话，避免历史对话因为供应商切换而消失。</div></div>
              <button type="button" class="codex-plus-toggle" data-codex-backend-setting="providerSyncEnabled"><span></span></button>
            </div>
            <div class="codex-plus-row">
              <div><div class="codex-plus-row-title">关于 ${codexPlusProductName}</div><div class="codex-plus-about">${codexPlusProductName}（${codexPlusProductSubtitle}）通过外部启动器注入增强能力，不修改 Codex App 原始安装文件。</div></div>
            </div>
          </div>
          <div class="codex-plus-panel" data-codex-plus-panel="relay" hidden>
            <div class="codex-plus-row">
              <div>
                <div class="codex-plus-row-title">apikey</div>
                <div class="codex-plus-row-description">填写服务地址和 apikey，之后 Codex 会用这组信息连接模型。</div>
                <div class="codex-plus-backend-label" data-codex-relay-status="true" data-status="failed">apikey 未配置</div>
                <div class="codex-plus-row-description" data-codex-relay-auth="true">增强启动时会跳过 ChatGPT 登录。</div>
                <div class="codex-plus-row-description">保存位置：<span data-codex-relay-config-path="true">~/.codex/config.toml</span></div>
                <div class="codex-plus-inline-warning" data-codex-relay-message="true"></div>
              </div>
              <button type="button" class="codex-plus-action-button" data-codex-relay-refresh="true">刷新状态</button>
            </div>
            <div class="codex-plus-row">
              <div>
                <div class="codex-plus-row-title">服务地址</div>
                <input class="codex-plus-text-input" data-codex-relay-base-url="true" type="url" placeholder="https://example.com/v1">
              </div>
            </div>
            <div class="codex-plus-row">
              <div>
                <div class="codex-plus-row-title">apikey</div>
                <input class="codex-plus-text-input" data-codex-relay-api-key="true" type="password" autocomplete="off" placeholder="粘贴 apikey，保存后不会在页面显示">
              </div>
            </div>
            <div class="codex-plus-row">
              <div><div class="codex-plus-row-title">保存或清理</div><div class="codex-plus-row-description">保存后会用于 Codex 增强启动；清理后恢复原来的配置。</div></div>
              <div class="codex-plus-row-actions">
                <button type="button" class="codex-plus-action-button" data-codex-relay-apply="true">保存 apikey</button>
                <button type="button" class="codex-plus-secondary-button" data-codex-relay-clear="true">清理 apikey</button>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    `;
    const closeButton = overlay.querySelector(".codex-plus-modal-close");
    closeButton?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      overlay.remove();
    }, true);
    overlay.addEventListener("click", (event) => {
      const target = event.target instanceof Element ? event.target : event.target?.parentElement;
      if (event.target === overlay || target?.closest(".codex-plus-modal-close")) {
        overlay.remove();
        return;
      }
      const tabButton = target?.closest("[data-codex-plus-tab]");
      if (tabButton) {
        selectCodexPlusTab(tabButton.getAttribute("data-codex-plus-tab"));
        return;
      }
      if (target?.closest("[data-codex-backend-repair]")) {
        repairBackend();
        return;
      }
      if (target?.closest("[data-codex-relay-refresh]")) {
        loadRelayStatus();
        return;
      }
      if (target?.closest("[data-codex-relay-apply]")) {
        applyRelayConfig();
        return;
      }
      if (target?.closest("[data-codex-relay-clear]")) {
        clearRelayConfig();
        return;
      }
      const toggle = target?.closest("[data-codex-plus-setting]");
      if (toggle) {
        const key = toggle.getAttribute("data-codex-plus-setting");
        setCodexPlusSetting(key, !codexPlusSettings()[key]);
        return;
      }
      const backendToggle = target?.closest("[data-codex-backend-setting]");
      if (backendToggle) {
        const key = backendToggle.getAttribute("data-codex-backend-setting");
        setBackendSetting(key, !codexPlusBackendSettings[key]);
        return;
      }
    }, true);
    overlay.addEventListener("change", (event) => {
      const input = event.target?.closest?.("[data-codex-backend-setting-input]");
      if (!input) return;
      setBackendSetting(input.getAttribute("data-codex-backend-setting-input"), input.value || "");
    }, true);
    overlay.addEventListener("keydown", (event) => {
      const input = event.target?.closest?.("[data-codex-backend-setting-input]");
      if (!input || event.key !== "Enter") return;
      event.preventDefault();
      input.blur();
      setBackendSetting(input.getAttribute("data-codex-backend-setting-input"), input.value || "");
    }, true);
    document.body.appendChild(overlay);
    selectCodexPlusTab("home");
    renderCodexPlusMenu();
    refreshCodexPlusBackendControls();
    renderBackendStatus();
    loadBackendSettings();
    loadRelayStatus();
  }

  function removeTopCodexPlusMenu() {
    removeDuplicateCodexPlusMenus(null);
  }

  function composerControlRoot() {
    const controls = Array.from(document.querySelectorAll("textarea, [contenteditable='true'], [role='textbox']"))
      .filter((node) => {
        if (isExtensionUiNode(node)) return false;
        const rect = node.getBoundingClientRect();
        return rect.width > 120 && rect.height > 16 && rect.top > window.innerHeight * 0.35;
      });
    const input = controls[controls.length - 1];
    if (!input) return null;
    return input.closest("form") || input.closest("[data-testid*='composer'], [class*='composer'], [class*='Composer']") || input.parentElement;
  }

  function currentSessionRow() {
    const rows = sessionRows(true);
    return rows.find((row) => isCurrentSessionRow(row, sessionRefFromRow(row)))
      || rows.find((row) => row.getAttribute("aria-current") === "page" || row.getAttribute("aria-current") === "true")
      || null;
  }

  function currentSessionRef() {
    const row = currentSessionRow();
    if (row) return sessionRefFromRow(row);
    const title = document.querySelector("[data-thread-title], header h1, header [class*='truncate']")?.textContent?.trim() || "Untitled session";
    const idMatch = window.location.href.match(/(?:session|conversation|thread)[=/:-]([A-Za-z0-9_.-]+)/i) || window.location.pathname.match(/([A-Za-z0-9_-]{8,})$/);
    return { session_id: idMatch?.[1] || "", title: title.slice(0, 160) };
  }

  function closeCodexPlusActionsMenu() {
    document.querySelectorAll(`.${codexPlusActionsMenuClass}`).forEach((node) => node.remove());
  }

  function positionActionsMenu(menu, anchor) {
    const rect = anchor.getBoundingClientRect();
    const menuWidth = Math.min(220, Math.max(168, window.innerWidth - 24));
    menu.style.width = `${menuWidth}px`;
    menu.style.left = `${Math.max(12, Math.min(window.innerWidth - menuWidth - 12, rect.right - menuWidth))}px`;
    menu.style.top = `${Math.max(12, Math.min(window.innerHeight - 150, rect.bottom + 6))}px`;
  }

  function openCodexPlusActionsMenu(anchor, event) {
    event?.preventDefault();
    event?.stopPropagation();
    closeCodexPlusActionsMenu();
    const menu = document.createElement("div");
    menu.className = codexPlusActionsMenuClass;
    menu.setAttribute("role", "menu");
    menu.innerHTML = `
      <button type="button" class="codex-plus-actions-menu-item" role="menuitem" data-codex-plus-action="move"><span class="codex-plus-actions-menu-icon">↗</span><span>移动</span></button>
      <button type="button" class="codex-plus-actions-menu-item" role="menuitem" data-codex-plus-action="export"><span class="codex-plus-actions-menu-icon">↓</span><span>导出</span></button>
      <button type="button" class="codex-plus-actions-menu-item" role="menuitem" data-codex-plus-action="settings"><span class="codex-plus-actions-menu-icon">⌘</span><span>设置</span></button>
    `;
    const closeOnOutside = (outsideEvent) => {
      if (menu.contains(outsideEvent.target) || anchor.contains(outsideEvent.target)) return;
      closeCodexPlusActionsMenu();
      document.removeEventListener("pointerdown", closeOnOutside, true);
    };
    menu.addEventListener("click", async (clickEvent) => {
      const item = clickEvent.target?.closest?.("[data-codex-plus-action]");
      if (!item) return;
      clickEvent.preventDefault();
      clickEvent.stopPropagation();
      const action = item.getAttribute("data-codex-plus-action");
      if (action === "settings") {
        closeCodexPlusActionsMenu();
        openCodexPlusModal();
        return;
      }
      const ref = currentSessionRef();
      if (!ref.session_id) {
        showToast("未找到当前会话", null);
        return;
      }
      if (action === "export") {
        closeCodexPlusActionsMenu();
        if (!codexPlusSettings().markdownExport) {
          showToast("Markdown 导出已在设置中关闭", null);
          return;
        }
        await exportMarkdown(ref);
        return;
      }
      if (action === "move") {
        if (!codexPlusSettings().projectMove) {
          showToast("会话项目移动已在设置中关闭", null);
          return;
        }
        const row = currentSessionRow();
        if (!row) {
          showToast("移动失败：未找到当前会话行", null);
          return;
        }
        await openProjectMoveMenuForRow(row, item, ref, clickEvent);
        closeCodexPlusActionsMenu();
      }
    }, true);
    document.body.appendChild(menu);
    positionActionsMenu(menu, anchor);
    setTimeout(() => document.addEventListener("pointerdown", closeOnOutside, true), 0);
    menu.querySelector("button")?.focus();
  }

  function installCodexPlusComposerBar() {
    const root = composerControlRoot();
    const existing = document.getElementById(codexPlusComposerId);
    if (!root) {
      existing?.remove();
      return;
    }
    let bar = existing;
    if (!bar || bar.dataset.codexPlusComposerVersion !== "1" || !bar.querySelector("[data-codex-composer-reconnect]") || !bar.querySelector(".codex-plus-composer-more")) {
      bar?.remove();
      bar = document.createElement("div");
      bar.id = codexPlusComposerId;
      bar.dataset.codexPlusComposerVersion = "1";
      bar.innerHTML = `
        <button type="button" class="codex-plus-composer-status" data-codex-composer-reconnect="true" title="点击重连 CodeX 增强">
          <span class="codex-plus-online-dot" aria-hidden="true"></span>
          <span class="codex-plus-backend-indicator" data-codex-backend-indicator="true" data-status="checking" aria-hidden="true"></span>
          <span class="codex-plus-composer-status-text">${codexPlusMenuLabel}</span>
        </button>
        <button type="button" class="codex-plus-composer-more" aria-label="更多操作" title="更多操作">⋯</button>
      `;
      bar.querySelector("[data-codex-composer-reconnect]")?.addEventListener("click", (clickEvent) => {
        clickEvent.preventDefault();
        clickEvent.stopPropagation();
        repairBackend();
      }, true);
      bar.querySelector(".codex-plus-composer-more")?.addEventListener("click", (clickEvent) => {
        openCodexPlusActionsMenu(clickEvent.currentTarget, clickEvent);
      }, true);
    }
    if (bar.nextSibling !== root) {
      root.parentElement?.insertBefore(bar, root);
    }
    renderBackendStatus();
  }

  function findNativeMenuInsertionPoint() {
    if (!codexPlusSettings().nativeMenuPlacement) return null;
    const header = document.querySelector(selectors.appHeader);
    const menuBar = header?.querySelector(selectors.nativeMenuBar);
    if (!menuBar) return null;
    const buttons = Array.from(menuBar.querySelectorAll("button")).filter((button) => !button.closest(`#${codexPlusMenuId}`));
    return { parent: menuBar, before: buttons[buttons.length - 1]?.nextSibling || null, nativeButtonClass: buttons[buttons.length - 1]?.className || "" };
  }

  function removeDuplicateCodexPlusMenus(keep) {
    document.querySelectorAll(`#${codexPlusMenuId}, [data-codex-plus-menu="true"]`).forEach((node) => {
      if (node !== keep) node.remove();
    });
    Array.from(document.querySelectorAll("button")).forEach((button) => {
      if (button.closest(`#${codexPlusComposerId}`)) return;
      if ((button.textContent || "").trim() === codexPlusMenuLabel && !button.closest(`#${codexPlusMenuId}`)) {
        button.remove();
      }
    });
  }

  function configureCodexPlusTrigger(menu, trigger, nativeButtonClass) {
    if (!trigger) return;
    if (nativeButtonClass) trigger.className = nativeButtonClass;
    if (trigger.dataset.codexPlusTriggerInstalled === "5") return;
    trigger.dataset.codexPlusTriggerInstalled = "5";
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      openCodexPlusModal();
    }, true);
  }

  function numericCssValue(value) {
    const parsed = Number.parseFloat(value || "");
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function setCssPropIfChanged(menu, prop, value) {
    if (menu.style.getPropertyValue(prop) !== value) {
      menu.style.setProperty(prop, value);
    }
  }

  function headerTitleRegion(header) {
    const candidates = Array.from(header?.querySelectorAll?.('[data-state], [class*="truncate"], [class*="text-base"]') || []);
    return candidates.find((node) => {
      if (!node?.querySelector?.('[data-state], button')) return false;
      if (!node.textContent?.trim()) return false;
      return node.closest?.(".draggable") || node.closest?.('[class*="grid-cols-[minmax(0,1fr)]"]');
    }) || null;
  }

  function isHeaderToolbarButton(button, header, rect) {
    if (!button || button.closest?.(`#${codexPlusMenuId}`)) return false;
    if (!(rect.width > 0 && rect.height > 0 && rect.left > window.innerWidth / 2)) return false;
    const buttonCluster = button.closest(".ms-auto.flex.shrink-0.items-center");
    if (buttonCluster && header?.contains(buttonCluster)) return true;
    const titleRegion = headerTitleRegion(header);
    if (titleRegion?.contains?.(button)) return false;
    return !!button.closest?.('[class*="ms-auto"][class*="shrink-0"][class*="items-center"]');
  }

  function updateFloatingCodexPlusMenuPosition(menu) {
    if (!menu?.classList?.contains(codexPlusMenuFloatingClass)) return;
    const header = document.querySelector(selectors.appHeader) || document.querySelector("header");
    if (!header) return;
    const toolbarButtons = Array.from(header.querySelectorAll("button"))
      .map((button) => ({ button, rect: button.getBoundingClientRect() }))
      .filter(({ button, rect }) => isHeaderToolbarButton(button, header, rect))
      .sort((left, right) => left.rect.left - right.rect.left);
    const anchor = toolbarButtons[0];
    if (anchor) {
      const measuredGap = toolbarButtons[1] ? toolbarButtons[1].rect.left - toolbarButtons[0].rect.right : 0;
      const styles = anchor.button.parentElement ? getComputedStyle(anchor.button.parentElement) : null;
      const gap = Math.max(numericCssValue(styles?.columnGap || styles?.gap), measuredGap, 0);
      setCssPropIfChanged(menu, "--codex-plus-menu-top", `${anchor.rect.top}px`);
      setCssPropIfChanged(menu, "--codex-plus-menu-height", `${anchor.rect.height}px`);
      setCssPropIfChanged(menu, "--codex-plus-menu-right", `${Math.max(0, window.innerWidth - anchor.rect.left + gap)}px`);
      return;
    }

    const headerRect = header.getBoundingClientRect();
    if (headerRect.height) {
      setCssPropIfChanged(menu, "--codex-plus-menu-top", `${headerRect.top}px`);
      setCssPropIfChanged(menu, "--codex-plus-menu-height", `${headerRect.height}px`);
    }
    menu.style.removeProperty("--codex-plus-menu-right");
  }

  function installCodexPlusMenu() {
    const existing = document.getElementById(codexPlusMenuId);
    removeDuplicateCodexPlusMenus(existing);
    let insertionPoint = findNativeMenuInsertionPoint();
    if (existing && existing.dataset.codexPlusMenuVersion !== "6") {
      existing.remove();
      insertionPoint = findNativeMenuInsertionPoint();
    } else if (existing && insertionPoint && existing.parentElement === insertionPoint.parent) {
      configureCodexPlusTrigger(existing, existing.querySelector("button"), insertionPoint.nativeButtonClass);
      removeDuplicateCodexPlusMenus(existing);
      return;
    }
    const menu = document.createElement("div");
    menu.id = codexPlusMenuId;
    menu.dataset.codexPlusMenu = "true";
    menu.dataset.codexPlusMenuVersion = "6";
    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.textContent = codexPlusMenuLabel;
    const indicator = document.createElement("span");
    indicator.className = "codex-plus-backend-indicator";
    indicator.dataset.codexBackendIndicator = "true";
    indicator.dataset.status = codexPlusBackendStatus.status || "checking";
    trigger.prepend(indicator);
    const nativeButtonClass = insertionPoint?.nativeButtonClass || "codex-plus-trigger";
    configureCodexPlusTrigger(menu, trigger, nativeButtonClass);
    menu.appendChild(trigger);
    if (insertionPoint) {
      menu.className = "";
      const safeBefore = insertionPoint.before?.parentElement === insertionPoint.parent ? insertionPoint.before : null;
      insertionPoint.parent.insertBefore(menu, safeBefore);
    } else {
      menu.className = codexPlusMenuFloatingClass;
      document.documentElement.appendChild(menu);
      updateFloatingCodexPlusMenuPosition(menu);
    }
    removeDuplicateCodexPlusMenus(menu);
  }

  function reactFiberFrom(element) {
    const fiberKey = Object.keys(element).find((key) => key.startsWith("__reactFiber"));
    return fiberKey ? element[fiberKey] : null;
  }

  function authContextValueFrom(element) {
    for (let fiber = reactFiberFrom(element); fiber; fiber = fiber.return) {
      for (const value of [fiber.memoizedProps?.value, fiber.pendingProps?.value]) {
        if (value && typeof value === "object" && typeof value.setAuthMethod === "function" && "authMethod" in value) {
          return value;
        }
      }
    }
    return null;
  }

  function spoofChatGPTAuthMethod(element) {
    const auth = authContextValueFrom(element);
    if (!auth || auth.authMethod === "chatgpt") return false;
    auth.setAuthMethod("chatgpt");
    return true;
  }

  function pluginEntryButton() {
    const byIcon = document.querySelector(`${selectors.pluginNavButton} ${selectors.pluginSvgPath}`)?.closest("button");
    if (byIcon) return byIcon;
    return Array.from(document.querySelectorAll(selectors.pluginNavButton))
      .find((button) => /^(插件|Plugins)(\s+-\s+.*)?$/i.test((button.textContent || "").trim())) || null;
  }

  function labelUnlockedPluginEntry(button) {
    const labelTextNode = Array.from(button.querySelectorAll("span, div")).reverse()
      .flatMap((node) => Array.from(node.childNodes))
      .find((node) => node.nodeType === 3 && /^(插件|Plugins)( - 已解锁| - Unlocked)?$/i.test((node.nodeValue || "").trim()));
    if (!labelTextNode) return;
    const current = (labelTextNode.nodeValue || "").trim();
    labelTextNode.nodeValue = /^Plugins/i.test(current) ? "Plugins - Unlocked" : "插件 - 已解锁";
  }

  function enablePluginEntry() {
    if (!codexPlusSettings().pluginEntryUnlock) return;
    const pluginButton = pluginEntryButton();
    if (!pluginButton) return;
    spoofChatGPTAuthMethod(pluginButton);
    pluginButton.disabled = false;
    pluginButton.removeAttribute("disabled");
    pluginButton.style.display = "";
    pluginButton.querySelectorAll("*").forEach((node) => {
      node.style.display = "";
    });
    labelUnlockedPluginEntry(pluginButton);
    const reactPropsKey = Object.keys(pluginButton).find((key) => key.startsWith("__reactProps"));
    if (reactPropsKey) {
      pluginButton[reactPropsKey].disabled = false;
    }
    if (pluginButton.dataset.codexPluginEnabled === "true") return;
    pluginButton.dataset.codexPluginEnabled = "true";
    pluginButton.addEventListener("click", () => {
      spoofChatGPTAuthMethod(pluginButton);
    }, true);
  }

  function pluginInstallCandidates() {
    return Array.from(document.querySelectorAll(selectors.disabledInstallButton));
  }

  function installButtonLabel(element) {
    return (element.textContent || "").trim();
  }

  function unblockButtonElement(button) {
    button.disabled = false;
    button.removeAttribute("disabled");
    button.removeAttribute("aria-disabled");
    button.classList.remove("disabled", "opacity-50", "cursor-not-allowed", "pointer-events-none");
    button.style.pointerEvents = "auto";
    button.tabIndex = 0;
    const reactPropsKey = Object.keys(button).find((key) => key.startsWith("__reactProps"));
    if (reactPropsKey) {
      button[reactPropsKey].disabled = false;
      button[reactPropsKey]["aria-disabled"] = false;
    }
  }

  function labelForcedInstallButton(button) {
    const textNode = Array.from(button.childNodes).find((node) => node.nodeType === 3 && (/^安装\s/.test((node.nodeValue || "").trim()) || /^Install\s/.test((node.nodeValue || "").trim()) || (node.nodeValue || "").trim() === "强制安装"));
    if (textNode) {
      textNode.nodeValue = "强制安装";
    }
  }

  function unblockPluginInstallButtons() {
    if (!codexPlusSettings().forcePluginInstall) return;
    pluginInstallCandidates().forEach((button) => {
      const text = installButtonLabel(button);
      if (!/^安装\s/.test(text) && !/^Install\s/.test(text) && text !== "强制安装") return;
      unblockButtonElement(button);
      labelForcedInstallButton(button);
    });
  }

  let cachedSessionRows = [];
  let cachedSessionRowsAt = 0;

  function sessionRows(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && now - cachedSessionRowsAt < 150) {
      cachedSessionRows = cachedSessionRows.filter((row) => row.isConnected);
      if (cachedSessionRows.length > 0) return cachedSessionRows;
    }

    cachedSessionRows = Array.from(document.querySelectorAll(selectors.sidebarThread));
    cachedSessionRowsAt = now;
    return cachedSessionRows;
  }

  function archivePageHintVisible() {
    if (window.location.href.includes("archive")) return true;
    if (document.querySelector('[data-codex-archive-page-row="true"], [data-codex-archive-delete-all]')) return true;
    const archiveNav = document.querySelector(selectors.archiveNav);
    if (archiveNav?.className?.includes?.("bg-token-list-hover-background")) return true;
    return !!Array.from(document.querySelectorAll("h1, h2, h3")).find((element) => (element.textContent || "").trim() === "已归档对话");
  }

  function archiveRowFromUnarchiveButton(button) {
    return button.closest('[data-codex-archive-page-row="true"]')
      || button.closest('[role="listitem"], [role="row"]')
      || button.closest(".flex.w-full.items-center.justify-between")
      || button.parentElement;
  }

  function archivedPageRows() {
    if (!archivePageHintVisible()) return [];
    const rows = Array.from(document.querySelectorAll("button")).filter((button) => (button.textContent || "").trim() === "取消归档").map(archiveRowFromUnarchiveButton).filter(Boolean);
    rows.forEach((row) => {
      row.dataset.codexArchivePageRow = "true";
      row.setAttribute("data-codex-archive-page-row", "true");
    });
    return rows;
  }

  function archivedSessionRows() {
    if (!archivePageHintVisible()) return [];
    return sessionRows().filter((row) => row.querySelector('button[aria-label="取消归档对话"]') || row.outerHTML.includes("取消归档") || row.outerHTML.includes("unarchive"));
  }

  function archivedRows() {
    if (!archivePageHintVisible()) return [];
    return [...archivedSessionRows(), ...archivedPageRows()];
  }

  function archivedPageVisible() {
    return archivePageHintVisible() && archivedRows().length > 0;
  }

  function sessionRefFromRow(row) {
    const href = row.getAttribute("href") || row.querySelector("a")?.getAttribute("href") || "";
    const idMatch = href.match(/(?:session|conversation|thread)[=/:-]([A-Za-z0-9_.-]+)/i) || href.match(/([A-Za-z0-9_-]{8,})$/);
    const codexThreadId = row.getAttribute("data-app-action-sidebar-thread-id") || "";
    const fallbackId = row.getAttribute("data-session-id") || row.getAttribute("data-testid") || "";
    const sessionId = codexThreadId || (idMatch && idMatch[1]) || fallbackId;
    const titleNode = row.querySelector(`${selectors.threadTitle}, .truncate.select-none, .truncate.text-base`);
    const rawTitle = (titleNode?.textContent || (titleNode ? "" : (row.textContent || "Untitled session")));
    const title = (titleNode ? rawTitle : rawTitle.replace(/\s*(导出|删除|移动|移出项目)(\s*(导出|删除|移动|移出项目))*$/g, "")).trim().slice(0, 160);
    return { session_id: sessionId, title };
  }

  async function postJson(path, payload) {
    if (!window.__codexSessionDeleteBridge) {
      if (path === "/backend/repair") return httpPostJson(path, payload);
      return { status: "failed", message: "桥接不可用，请点击状态重连" };
    }
    try {
      return await Promise.race([
        window.__codexSessionDeleteBridge(path, payload),
        new Promise((resolve) => setTimeout(() => resolve({ status: "failed", message: "桥接超时，请点击状态重连" }), 3500)),
      ]);
    } catch (error) {
      if (path === "/backend/repair") return httpPostJson(path, payload);
      return { status: "failed", message: error?.message || "桥接请求失败，请点击状态重连" };
    }
  }

  async function httpPostJson(path, payload) {
    const response = await fetch(`${helperBase}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload || {}),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return { status: "failed", message: data.message || data.error || "请求失败" };
    return data;
  }

  let codexStateApiPromise = null;
  let chatsSortInFlight = false;
  let chatsSortSignature = "";
  let chatsSortLastFetchAt = 0;

  async function codexStateApi() {
    codexStateApiPromise = codexStateApiPromise || import("./assets/vscode-api-Dc9pX2Bc.js");
    const api = await codexStateApiPromise;
    if (typeof api.n !== "function") throw new Error("Codex 状态 API 不可用");
    return api.n;
  }

  async function codexStateCall(method, params) {
    const call = await codexStateApi();
    return await call(method, params);
  }

  async function getCodexGlobalState(key) {
    const result = await codexStateCall("get-global-state", { params: { key } });
    return result && Object.prototype.hasOwnProperty.call(result, "value") ? result.value : result;
  }

  async function setCodexGlobalState(key, value) {
    return await codexStateCall("set-global-state", { params: { key, value } });
  }

  function objectGlobalState(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? { ...value } : {};
  }

  function uniqueValues(values) {
    return Array.from(new Set(values.filter((value) => typeof value === "string" && value.trim().length > 0)));
  }

  function threadIdVariants(sessionId) {
    if (typeof sessionId !== "string" || !sessionId.trim()) return [];
    const id = sessionId.trim();
    const bareId = id.startsWith("local:") ? id.slice("local:".length) : id;
    return uniqueValues([id, bareId, `local:${bareId}`]);
  }

  function projectMoveSessionKey(sessionId) {
    const variants = threadIdVariants(sessionId);
    const bareId = variants.find((id) => !id.startsWith("local:"));
    return bareId || variants[0] || "";
  }

  function uuidV7TimestampMs(sessionId) {
    const id = projectMoveSessionKey(sessionId).replaceAll("-", "");
    if (!/^[0-9a-fA-F]{12}/.test(id)) return 0;
    const timestamp = Number.parseInt(id.slice(0, 12), 16);
    return Number.isFinite(timestamp) ? timestamp : 0;
  }

  function numericTimestamp(value) {
    const timestamp = Number(value);
    return Number.isFinite(timestamp) && timestamp > 0 ? timestamp : 0;
  }

  function timestampValueToMs(value) {
    const timestamp = numericTimestamp(value);
    if (!timestamp) return 0;
    return timestamp < 1000000000000 ? timestamp * 1000 : timestamp;
  }

  function sortMsForSession(sessionId, preferredValue) {
    return numericTimestamp(preferredValue) || uuidV7TimestampMs(sessionId);
  }

  function timestampMsFromPayload(payload) {
    return numericTimestamp(payload?.updated_at_ms) || timestampValueToMs(payload?.updated_at) || numericTimestamp(payload?.created_at_ms);
  }

  function relativeTimeLabel(timestampMs, nowMs = Date.now()) {
    const timestamp = numericTimestamp(timestampMs);
    if (!timestamp) return "";
    const elapsedSeconds = Math.max(0, Math.floor((nowMs - timestamp) / 1000));
    if (elapsedSeconds < 60) return "刚刚";
    const elapsedMinutes = Math.floor(elapsedSeconds / 60);
    if (elapsedMinutes < 60) return `${elapsedMinutes} 分`;
    const elapsedHours = Math.floor(elapsedMinutes / 60);
    if (elapsedHours < 24) return `${elapsedHours} 小时`;
    const elapsedDays = Math.floor(elapsedHours / 24);
    if (elapsedDays < 7) return `${elapsedDays} 天`;
    const elapsedWeeks = Math.floor(elapsedDays / 7);
    if (elapsedWeeks < 5) return `${elapsedWeeks} 周`;
    const elapsedMonths = Math.floor(elapsedDays / 30);
    if (elapsedMonths < 12) return `${Math.max(1, elapsedMonths)} 月`;
    return `${Math.floor(elapsedDays / 365)} 年`;
  }

  function normalizeWorkspacePath(path) {
    const normalized = String(path || "").trim().replace(/\\/g, "/").replace(/\/+$/, "");
    return normalized || String(path || "").trim();
  }

  function sameWorkspacePath(left, right) {
    const leftPath = normalizeWorkspacePath(left);
    const rightPath = normalizeWorkspacePath(right);
    return !!leftPath && !!rightPath && leftPath === rightPath;
  }

  function displayProjectName(path) {
    const trimmed = String(path || "").replace(/\/+$/, "");
    return trimmed.split(/[\\/]+/).filter(Boolean).pop() || trimmed || "未命名项目";
  }

  function normalizeProjectLabel(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function projectsSection() {
    return document.querySelector('[data-app-action-sidebar-section-heading="Projects"]');
  }

  function chatsSection() {
    return document.querySelector('[data-app-action-sidebar-section-heading="Chats"]');
  }

  function projectRowListItem(projectRow) {
    return projectRow.closest?.('[role="listitem"][aria-label]') || projectRow.closest?.('[role="listitem"]') || projectRow;
  }

  function nativeProjectTargets() {
    const section = projectsSection();
    const seen = new Set();
    const targets = [];
    Array.from(document.querySelectorAll('[data-app-action-sidebar-project-row]')).forEach((row) => {
      if (section && !section.contains(row)) return;
      const path = row.getAttribute("data-app-action-sidebar-project-id") || "";
      const normalizedPath = normalizeWorkspacePath(path);
      if (!normalizedPath || seen.has(normalizedPath)) return;
      const label = row.getAttribute("data-app-action-sidebar-project-label") || row.getAttribute("aria-label") || displayProjectName(path);
      seen.add(normalizedPath);
      targets.push({ kind: "project", label: String(label || displayProjectName(path)), description: path, path, normalizedPath, row, listItem: projectRowListItem(row) });
    });
    return targets;
  }

  function serializableProjectTarget(target) {
    return { kind: target.kind, label: target.label, description: target.description, path: target.path, normalizedPath: target.normalizedPath || normalizeWorkspacePath(target.path) };
  }

  function projectMoveTargets() {
    return [
      { kind: "projectless", label: "普通对话", description: "不属于任何项目", path: "", normalizedPath: "" },
      ...nativeProjectTargets().map(serializableProjectTarget),
    ];
  }

  function readLegacyProjectMoveProjection() {
    try {
      const parsed = JSON.parse(localStorage.getItem(legacyProjectMoveOverridesKey) || "{}");
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
      const now = Date.now();
      const next = {};
      for (const [key, value] of Object.entries(parsed)) {
        if (!value || typeof value !== "object" || !value.targetCwd) continue;
        const sessionId = projectMoveSessionKey(value.sessionId || key);
        if (!sessionId) continue;
        next[sessionId] = {
          sessionId,
          targetKind: "project",
          targetCwd: String(value.targetCwd),
          targetLabel: String(value.targetLabel || displayProjectName(value.targetCwd)),
          title: String(value.title || ""),
          sortMs: sortMsForSession(sessionId, value.sortMs || value.updatedAtMs || value.updated_at_ms),
          sortMsTrusted: false,
          at: typeof value.at === "number" ? value.at : now,
        };
      }
      return next;
    } catch {
      return {};
    }
  }

  function readProjectMoveProjection() {
    try {
      const parsed = JSON.parse(localStorage.getItem(projectMoveProjectionKey) || "{}");
      const raw = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
      const merged = { ...readLegacyProjectMoveProjection(), ...raw };
      const now = Date.now();
      const projection = {};
      for (const [key, value] of Object.entries(merged)) {
        if (!value || typeof value !== "object") continue;
        const sessionId = projectMoveSessionKey(value.sessionId || key);
        if (!sessionId) continue;
        if (typeof value.at === "number" && now - value.at > projectMoveProjectionTtlMs) continue;
        const targetKind = value.targetKind === "projectless" ? "projectless" : "project";
        const targetCwd = String(value.targetCwd || value.path || "");
        if (targetKind === "project" && !targetCwd) continue;
        projection[sessionId] = {
          sessionId,
          targetKind,
          targetCwd,
          targetLabel: String(value.targetLabel || value.label || (targetKind === "projectless" ? "普通对话" : displayProjectName(targetCwd))),
          title: String(value.title || ""),
          sortMs: sortMsForSession(sessionId, value.sortMs || value.updatedAtMs || value.updated_at_ms),
          sortMsTrusted: value.sortMsTrusted === true,
          at: typeof value.at === "number" ? value.at : now,
        };
      }
      return projection;
    } catch {
      return readLegacyProjectMoveProjection();
    }
  }

  function writeProjectMoveProjection(projection) {
    try {
      localStorage.setItem(projectMoveProjectionKey, JSON.stringify(projection || {}));
      localStorage.removeItem(legacyProjectMoveOverridesKey);
    } catch (error) {
      window.__codexProjectMoveProjectionFailures = window.__codexProjectMoveProjectionFailures || [];
      window.__codexProjectMoveProjectionFailures.push(String(error?.stack || error));
    }
  }

  function saveProjectMoveProjection(ref, target, sortMs) {
    const id = projectMoveSessionKey(ref.session_id);
    if (!id || !target) return;
    const projection = readProjectMoveProjection();
    projection[id] = {
      sessionId: id,
      targetKind: target.kind === "projectless" ? "projectless" : "project",
      targetCwd: target.path || "",
      targetLabel: target.label || (target.kind === "projectless" ? "普通对话" : displayProjectName(target.path)),
      title: ref.title || "",
      sortMs: sortMsForSession(ref.session_id, sortMs || target.sortMs),
      sortMsTrusted: target.sortMsTrusted === true,
      at: Date.now(),
    };
    writeProjectMoveProjection(projection);
  }

  function clearProjectMoveProjection(ref) {
    const projection = readProjectMoveProjection();
    const keys = threadIdVariants(ref.session_id).map(projectMoveSessionKey).filter(Boolean);
    let changed = false;
    keys.forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(projection, key)) {
        delete projection[key];
        changed = true;
      }
    });
    if (changed) writeProjectMoveProjection(projection);
  }

  function projectionForSessionId(sessionId, projection = readProjectMoveProjection()) {
    const key = projectMoveSessionKey(sessionId);
    return key ? projection[key] || null : null;
  }

  function projectRowFromListItem(projectItem) {
    if (!projectItem) return null;
    if (projectItem.matches?.("[data-app-action-sidebar-project-row]")) return projectItem;
    return projectItem.querySelector?.("[data-app-action-sidebar-project-row]") || null;
  }

  function targetPath(target) {
    return target?.path || target?.targetCwd || "";
  }

  function targetLabel(target) {
    return target?.label || target?.targetLabel || displayProjectName(targetPath(target));
  }

  function projectItemMatchesTarget(projectItem, target) {
    const projectRow = projectRowFromListItem(projectItem);
    const projectPath = projectRow?.getAttribute?.("data-app-action-sidebar-project-id") || "";
    if (projectPath && sameWorkspacePath(projectPath, targetPath(target))) return true;
    const actual = normalizeProjectLabel(projectRow?.getAttribute?.("data-app-action-sidebar-project-label") || projectItem?.getAttribute?.("aria-label"));
    const labels = uniqueValues([targetLabel(target), displayProjectName(targetPath(target))]).map(normalizeProjectLabel).filter(Boolean);
    return !!actual && labels.includes(actual);
  }

  function findProjectListItem(target) {
    const nativeTarget = nativeProjectTargets().find((project) => sameWorkspacePath(project.path, targetPath(target)));
    if (nativeTarget?.listItem) return nativeTarget.listItem;
    const section = projectsSection();
    if (!section) return null;
    return Array.from(section.querySelectorAll('[role="listitem"][aria-label]')).find((item) => projectItemMatchesTarget(item, target)) || null;
  }

  function closestProjectListItem(row) {
    const item = row.closest?.('[role="listitem"][aria-label]');
    return item?.closest?.('[data-app-action-sidebar-section-heading="Projects"]') ? item : null;
  }

  function rowIsInChats(row) {
    return !!row.closest?.('[data-app-action-sidebar-section-heading="Chats"]');
  }

  function chatsThreadList() {
    return chatsSection()?.querySelector?.('[role="list"][aria-label="对话"], [role="list"]') || null;
  }

  function rowIsUnderTargetProject(row, target) {
    const item = closestProjectListItem(row);
    return !!item && projectItemMatchesTarget(item, target);
  }

  function rowIsUnderTarget(row, target) {
    return target?.targetKind === "projectless" || target?.kind === "projectless" ? rowIsInChats(row) : rowIsUnderTargetProject(row, target);
  }

  function rowListItem(row) {
    return row.closest?.('[role="listitem"]') || row;
  }

  function rowContentRoot(row) {
    return Array.from(row?.children || []).find((child) => String(child.className || "").includes("h-full w-full items-center")) || null;
  }

  function normalizedText(node) {
    return String(node?.textContent || "").replace(/\s+/g, " ").trim();
  }

  function classNameText(node) {
    return String(node?.className || "");
  }

  function isRelativeTimeText(text) {
    const value = String(text || "").replace(/\s+/g, " ").trim();
    return /^(刚刚|just now|\d+\s*(秒|秒钟|分|分钟|小时|天|日|周|星期|个月|月|年|sec|secs|second|seconds|min|mins|minute|minutes|h|hr|hrs|hour|hours|d|day|days|w|wk|wks|week|weeks|mo|mos|month|months|y|yr|yrs|year|years))$/i.test(value);
  }

  function nodeIsThreadTitle(row, node) {
    return Array.from(row?.querySelectorAll?.('[data-thread-title], .truncate.select-none, .truncate.text-base') || [])
      .some((titleNode) => titleNode === node || titleNode.contains(node));
  }

  function closestTimeWrapper(row, node) {
    const root = rowContentRoot(row) || row;
    let current = node?.parentElement || null;
    while (current && current !== root && current !== row) {
      const className = classNameText(current);
      if (current.dataset?.codexProjectMoveTimeWrapper === "true" || (className.includes("ml-[3px]") && className.includes("min-w-[26px]"))) return current;
      current = current.parentElement;
    }
    return null;
  }

  function nodeInsideStatusIcon(row, node) {
    const stop = closestTimeWrapper(row, node) || rowContentRoot(row) || row;
    let current = node || null;
    while (current && current !== stop && current !== row) {
      const className = classNameText(current);
      if (className.includes("animate-spin")) return true;
      if (className.includes("size-5") && className.includes("shrink-0")) return true;
      if (className.includes("contain-paint") && className.includes("contain-layout")) return true;
      current = current.parentElement;
    }
    return false;
  }

  function cleanupManagedStatusIconTimeNodes(row) {
    Array.from(row?.querySelectorAll?.('[data-codex-project-move-time="true"]') || []).forEach((node) => {
      if (!nodeInsideStatusIcon(row, node)) return;
      const text = normalizedText(node);
      delete node.dataset.codexProjectMoveTime;
      delete node.dataset.codexProjectMoveTimeMs;
      if (node.children.length === 0 && isRelativeTimeText(text)) node.textContent = "";
    });
  }

  function nodeLooksLikeTimeLabel(row, node) {
    if (nodeInsideStatusIcon(row, node)) return false;
    if (node?.dataset?.codexProjectMoveTime === "true") return true;
    if (node.children.length > 0) return false;
    const text = normalizedText(node);
    const className = classNameText(node);
    if ((className.includes("tabular-nums") || className.includes("text-token-description-foreground")) && text.length <= 24) return true;
    if (!isRelativeTimeText(text)) return false;
    const rowRect = row?.getBoundingClientRect?.();
    const nodeRect = node?.getBoundingClientRect?.();
    if (!rowRect || !nodeRect || rowRect.width <= 0 || nodeRect.width <= 0) return false;
    return nodeRect.left >= rowRect.left + rowRect.width * 0.45 || nodeRect.right >= rowRect.right - 96;
  }

  function rowTimeLabelCandidates(row) {
    cleanupManagedStatusIconTimeNodes(row);
    const root = rowContentRoot(row) || row;
    const raw = Array.from(root?.querySelectorAll?.("div, span, time, small") || []).filter((node) => {
      if (nodeIsThreadTitle(row, node)) return false;
      return nodeLooksLikeTimeLabel(row, node);
    });
    return raw.filter((node) => !raw.some((other) => other !== node && node.contains(other)));
  }

  function rowTimeLabelNode(row) {
    const candidates = rowTimeLabelCandidates(row);
    return candidates.find((node) => node.dataset?.codexProjectMoveTime !== "true" && !node.closest?.('[data-codex-project-move-time-wrapper="true"]')) || candidates[0] || null;
  }

  function removeTimeLabelNode(row, node) {
    if (!node || !row?.contains?.(node)) return;
    const wrapper = node.closest?.('[data-codex-project-move-time-wrapper="true"]') || closestTimeWrapper(row, node);
    if (wrapper && wrapper !== row && row.contains(wrapper)) {
      wrapper.remove();
      return;
    }
    node.remove();
  }

  function cleanupRowTimeLabels(row, keepNode) {
    if (!keepNode) return;
    rowTimeLabelCandidates(row).forEach((node) => {
      if (node === keepNode) return;
      if (node.dataset?.codexProjectMoveTime === "true" || node.closest?.('[data-codex-project-move-time-wrapper="true"]')) removeTimeLabelNode(row, node);
    });
  }

  function ensureRowTimeLabelNode(row) {
    const existing = rowTimeLabelNode(row);
    if (existing) {
      cleanupRowTimeLabels(row, existing);
      return existing;
    }
    const root = rowContentRoot(row);
    if (!root) return null;
    const wrapper = document.createElement("div");
    wrapper.className = "ml-[3px] flex items-center justify-end gap-1 min-w-[26px]";
    wrapper.dataset.codexProjectMoveTimeWrapper = "true";
    const inner = document.createElement("div");
    const label = document.createElement("div");
    label.className = "text-token-description-foreground text-sm leading-4 empty:hidden tabular-nums overflow-visible truncate text-right group-focus-within:opacity-0 group-hover:opacity-0";
    label.dataset.codexProjectMoveTime = "true";
    inner.appendChild(label);
    wrapper.appendChild(inner);
    root.appendChild(wrapper);
    return label;
  }

  function updateRowTimeLabel(row, sortMs) {
    const label = ensureRowTimeLabelNode(row);
    if (!label) return;
    const timestamp = numericTimestamp(sortMs);
    const text = relativeTimeLabel(timestamp);
    label.dataset.codexProjectMoveTime = "true";
    label.dataset.codexProjectMoveTimeMs = String(timestamp || 0);
    if (text && label.textContent !== text) label.textContent = text;
    cleanupRowTimeLabels(row, label);
  }

  function rowProjectionKind(row) {
    return row?.dataset?.codexProjectMoveTargetKind || rowListItem(row)?.dataset?.codexProjectMoveTargetKind || "";
  }

  function rowSortMs(row, ref = sessionRefFromRow(row), target = null) {
    return sortMsForSession(ref.session_id, target?.sortMs || row?.dataset?.codexProjectMoveSortMs || rowListItem(row)?.dataset?.codexProjectMoveSortMs);
  }

  function threadRowFromListItem(item) {
    if (!item) return null;
    if (item.matches?.("[data-app-action-sidebar-thread-id]")) return item;
    return item.querySelector?.("[data-app-action-sidebar-thread-id]") || null;
  }

  function rowPinned(row) {
    return row?.getAttribute?.("data-app-action-sidebar-thread-pinned") === "true" || rowListItem(row)?.getAttribute?.("data-app-action-sidebar-thread-pinned") === "true";
  }

  function insertRowItemByTime(list, item, row, target) {
    const ref = sessionRefFromRow(row);
    const sortMs = rowSortMs(row, ref, target);
    item.dataset.codexProjectMoveSortMs = String(sortMs || 0);
    row.dataset.codexProjectMoveSortMs = String(sortMs || 0);
    if (target?.sortMsTrusted) updateRowTimeLabel(row, sortMs);
    const pinned = rowPinned(row);
    const sessionKey = projectMoveSessionKey(ref.session_id);
    const existingItems = Array.from(list.children).filter((child) => child !== item);
    let firstNonThreadItem = null;
    for (const child of existingItems) {
      const childRow = threadRowFromListItem(child);
      if (!childRow) {
        firstNonThreadItem = firstNonThreadItem || child;
        continue;
      }
      const childPinned = rowPinned(childRow);
      if (childPinned && !pinned) continue;
      if (!childPinned && pinned) {
        list.insertBefore(item, child);
        return;
      }
      const childRef = sessionRefFromRow(childRow);
      const childSortMs = rowSortMs(childRow, childRef);
      const childKey = projectMoveSessionKey(childRef.session_id);
      if (sortMs > childSortMs || (sortMs === childSortMs && sessionKey > childKey)) {
        list.insertBefore(item, child);
        return;
      }
    }
    if (firstNonThreadItem) {
      list.insertBefore(item, firstNonThreadItem);
      return;
    }
    list.appendChild(item);
  }

  function projectMoveInjectedList(projectItem) {
    let list = projectItem.querySelector('[data-codex-project-move-injected-list="true"]');
    if (!list) {
      const body = Array.from(projectItem.children).find((child) => child.classList?.contains("overflow-hidden")) || projectItem;
      list = document.createElement("div");
      list.setAttribute("role", "list");
      list.setAttribute("data-codex-project-move-injected-list", "true");
      list.className = "flex flex-col";
      body.appendChild(list);
    }
    return list;
  }

  function projectThreadList(projectItem, target) {
    const targetCwd = targetPath(target);
    const projectLists = Array.from(projectItem.querySelectorAll("[data-app-action-sidebar-project-list-id]"));
    return projectLists.find((list) => sameWorkspacePath(list.getAttribute("data-app-action-sidebar-project-list-id"), targetCwd))
      || projectLists[0]
      || projectMoveInjectedList(projectItem);
  }

  function projectEmptyStateNodes(projectItem) {
    const emptyLabels = new Set(["暂无对话", "No conversations"]);
    return Array.from(projectItem.querySelectorAll("div, span")).filter((node) => {
      if (node.classList?.contains("overflow-hidden")) return false;
      if (node.closest('[data-app-action-sidebar-thread-id], [data-codex-project-move-injected-list="true"]')) return false;
      return emptyLabels.has(normalizeProjectLabel(node.textContent));
    });
  }

  function setProjectEmptyStateHidden(projectItem, hidden) {
    projectEmptyStateNodes(projectItem).forEach((node) => {
      if (hidden) {
        node.dataset.codexProjectMoveEmptyHidden = "true";
        node.classList.add("codex-project-move-hidden");
      } else if (node.dataset.codexProjectMoveEmptyHidden === "true") {
        delete node.dataset.codexProjectMoveEmptyHidden;
        node.classList.remove("codex-project-move-hidden");
      }
    });
  }

  function updateProjectMoveEmptyStates() {
    document.querySelectorAll('[data-codex-project-move-injected-list="true"]').forEach((list) => {
      const projectItem = list.closest('[role="listitem"][aria-label]');
      const hasRows = Array.from(list.children).some((child) => child.querySelector?.("[data-app-action-sidebar-thread-id]") || child.matches?.("[data-app-action-sidebar-thread-id]"));
      if (!hasRows) list.remove();
      if (projectItem) setProjectEmptyStateHidden(projectItem, hasRows);
    });
    document.querySelectorAll('[data-codex-project-move-empty-hidden="true"]').forEach((node) => {
      const projectItem = node.closest('[role="listitem"][aria-label]');
      const list = projectItem?.querySelector?.('[data-codex-project-move-injected-list="true"]');
      if (!list || list.children.length === 0) {
        delete node.dataset.codexProjectMoveEmptyHidden;
        node.classList.remove("codex-project-move-hidden");
      }
    });
  }

  function moveRowToProjectList(row, target) {
    const projectItem = findProjectListItem(target);
    if (!projectItem) return false;
    const list = projectThreadList(projectItem, target);
    const item = rowListItem(row);
    if (!list) return false;
    insertRowItemByTime(list, item, row, target);
    cachedSessionRowsAt = 0;
    item.dataset.codexProjectMoveTargetKind = "project";
    item.dataset.codexProjectMoveTargetCwd = targetPath(target);
    row.dataset.codexProjectMoveTargetKind = "project";
    row.dataset.codexProjectMoveTargetCwd = targetPath(target);
    setProjectEmptyStateHidden(projectItem, true);
    return true;
  }

  function moveRowToChats(row, target = null) {
    const list = chatsThreadList();
    if (!list) return false;
    const item = rowListItem(row);
    insertRowItemByTime(list, item, row, target);
    cachedSessionRowsAt = 0;
    item.dataset.codexProjectMoveTargetKind = "projectless";
    row.dataset.codexProjectMoveTargetKind = "projectless";
    delete item.dataset.codexProjectMoveTargetCwd;
    delete row.dataset.codexProjectMoveTargetCwd;
    updateProjectMoveEmptyStates();
    return true;
  }

  function applyProjectMoveProjection() {
    if (!codexPlusSettings().projectMove) return;
    const projection = readProjectMoveProjection();
    const targetRowsById = new Map();
    const settledRefs = [];
    const now = Date.now();
    const rows = sessionRows(true);
    rows.forEach((row) => {
      const ref = sessionRefFromRow(row);
      const target = projectionForSessionId(ref.session_id, projection);
      if (target && rowIsUnderTarget(row, target)) {
        const rowId = projectMoveSessionKey(ref.session_id);
        const hadProjectionKind = !!rowProjectionKind(row);
        const existingRow = targetRowsById.get(rowId);
        if (existingRow && existingRow !== row) {
          const existingIsProjection = !!rowProjectionKind(existingRow);
          const currentIsProjection = !!rowProjectionKind(row);
          const rowToRemove = existingIsProjection && !currentIsProjection ? existingRow : row;
          rowListItem(rowToRemove).remove();
          if (rowToRemove === existingRow) targetRowsById.set(rowId, row);
          if (rowToRemove === row) return;
        } else {
          targetRowsById.set(rowId, row);
        }
        if (!hadProjectionKind && typeof target.at === "number" && now - target.at > projectMoveProjectionSettleMs) settledRefs.push(ref);
        const moved = target.targetKind === "projectless" ? moveRowToChats(row, target) : moveRowToProjectList(row, target);
        if (moved) targetRowsById.set(rowId, row);
        const projectItem = closestProjectListItem(row);
        if (projectItem) setProjectEmptyStateHidden(projectItem, true);
      }
    });
    rows.forEach((row) => {
      const ref = sessionRefFromRow(row);
      const rowId = projectMoveSessionKey(ref.session_id);
      const target = projectionForSessionId(ref.session_id, projection);
      if (!target) {
        const item = rowListItem(row);
        delete row.dataset.codexProjectMoveTargetKind;
        delete row.dataset.codexProjectMoveTargetCwd;
        delete item.dataset.codexProjectMoveTargetKind;
        delete item.dataset.codexProjectMoveTargetCwd;
        return;
      }
      if (rowIsUnderTarget(row, target)) return;
      if (targetRowsById.has(rowId)) {
        rowListItem(row).remove();
        return;
      }
      const moved = target.targetKind === "projectless" ? moveRowToChats(row, target) : moveRowToProjectList(row, target);
      if (moved) targetRowsById.set(rowId, row);
    });
    settledRefs.forEach(clearProjectMoveProjection);
    updateProjectMoveEmptyStates();
  }

  function scheduleProjectMoveProjection() {
    if (!codexPlusSettings().projectMove || window.__codexProjectMoveProjectionTimer) return;
    window.__codexProjectMoveProjectionTimer = setTimeout(() => {
      if (window.__codexProjectMoveRuntimeId !== codexProjectMoveRuntimeId) return;
      window.__codexProjectMoveProjectionTimer = null;
      applyProjectMoveProjection();
    }, 80);
  }

  async function refreshRecentConversationsForHost() {
    try {
      const signals = await import("./assets/app-server-manager-signals-C1h8B-R-.js");
      if (typeof signals.rn === "function") await signals.rn("refresh-recent-conversations-for-host", { hostId: "local", sortKey: "updated_at" });
    } catch (error) {
      window.__codexProjectMoveRefreshFailures = window.__codexProjectMoveRefreshFailures || [];
      window.__codexProjectMoveRefreshFailures.push(String(error?.stack || error));
    }
  }

  function refreshAfterProjectMove() {
    const refreshVisibleSidebar = () => {
      applyProjectMoveProjection();
      scheduleChatsSortCorrection(0);
    };
    refreshVisibleSidebar();
    refreshRecentConversationsForHost().finally(() => {
      projectMoveRefreshDelaysMs.forEach((delay) => setTimeout(refreshVisibleSidebar, delay));
    });
  }

  function visibleChatsRows() {
    const list = chatsThreadList();
    if (!list) return [];
    return Array.from(list.children).map(threadRowFromListItem).filter(Boolean).filter((row) => rowIsInChats(row));
  }

  function chatsSortNeedsCorrection(rows) {
    let previousPinned = true;
    let previousSortMs = Infinity;
    let previousKey = "\uffff";
    for (const row of rows) {
      const pinned = rowPinned(row);
      const ref = sessionRefFromRow(row);
      const sortMs = rowSortMs(row, ref);
      const key = projectMoveSessionKey(ref.session_id);
      if (previousPinned && !pinned) {
        previousPinned = false;
        previousSortMs = sortMs;
        previousKey = key;
        continue;
      }
      if (!previousPinned && pinned) return true;
      if (sortMs > previousSortMs || (sortMs === previousSortMs && key > previousKey)) return true;
      previousSortMs = sortMs;
      previousKey = key;
    }
    return false;
  }

  function reorderChatsRows(rows) {
    const list = chatsThreadList();
    if (!list || rows.length < 2) return;
    const rowItems = new Set(rows.map(rowListItem));
    const firstNonThreadItem = Array.from(list.children).find((child) => !rowItems.has(child) && !threadRowFromListItem(child));
    const orderedRows = [...rows].sort((left, right) => {
      const leftPinned = rowPinned(left);
      const rightPinned = rowPinned(right);
      if (leftPinned !== rightPinned) return leftPinned ? -1 : 1;
      const leftRef = sessionRefFromRow(left);
      const rightRef = sessionRefFromRow(right);
      const leftSortMs = rowSortMs(left, leftRef);
      const rightSortMs = rowSortMs(right, rightRef);
      if (leftSortMs !== rightSortMs) return rightSortMs - leftSortMs;
      return projectMoveSessionKey(rightRef.session_id).localeCompare(projectMoveSessionKey(leftRef.session_id));
    });
    orderedRows.forEach((row) => list.insertBefore(rowListItem(row), firstNonThreadItem || null));
    cachedSessionRowsAt = 0;
  }

  async function applyChatsSortCorrection() {
    if (!codexPlusSettings().projectMove || chatsSortInFlight) return;
    const rows = visibleChatsRows();
    if (rows.length < 2) return;
    const refs = rows.map(sessionRefFromRow).filter((ref) => ref.session_id);
    const signature = refs.map((ref) => projectMoveSessionKey(ref.session_id)).join("|");
    const allRowsHaveSortMs = rows.every((row) => numericTimestamp(row.dataset.codexProjectMoveSortMs || rowListItem(row).dataset.codexProjectMoveSortMs));
    const shouldRefreshSortKeys = signature !== chatsSortSignature || !allRowsHaveSortMs || Date.now() - chatsSortLastFetchAt > chatsSortDbRefreshIntervalMs;
    if (!shouldRefreshSortKeys && !chatsSortNeedsCorrection(rows)) return;
    chatsSortInFlight = true;
    try {
      if (shouldRefreshSortKeys) {
        const result = await postJson("/thread-sort-keys", { sessions: refs }).catch(() => ({ status: "failed", sort_keys: [] }));
        chatsSortLastFetchAt = Date.now();
        const byId = new Map();
        if (result?.status === "ok" && Array.isArray(result?.sort_keys)) {
          result.sort_keys.forEach((item) => {
            const key = projectMoveSessionKey(String(item?.session_id || ""));
            if (key) byId.set(key, item);
          });
        }
        rows.forEach((row) => {
          const ref = sessionRefFromRow(row);
          const payload = byId.get(projectMoveSessionKey(ref.session_id));
          const trustedSortMs = timestampMsFromPayload(payload);
          const sortMs = trustedSortMs || sortMsForSession(ref.session_id, row.dataset.codexProjectMoveSortMs || rowListItem(row).dataset.codexProjectMoveSortMs);
          row.dataset.codexProjectMoveSortMs = String(sortMs || 0);
          rowListItem(row).dataset.codexProjectMoveSortMs = String(sortMs || 0);
          if (trustedSortMs) updateRowTimeLabel(row, trustedSortMs);
        });
      }
      if (chatsSortNeedsCorrection(rows)) reorderChatsRows(rows);
      chatsSortSignature = visibleChatsRows().map((row) => projectMoveSessionKey(sessionRefFromRow(row).session_id)).join("|");
    } finally {
      chatsSortInFlight = false;
    }
  }

  function scheduleChatsSortCorrection(delay = chatsSortRefreshIntervalMs) {
    if (!codexPlusSettings().projectMove || window.__codexProjectMoveChatsSortTimer) return;
    window.__codexProjectMoveChatsSortTimer = setTimeout(() => {
      if (window.__codexProjectMoveRuntimeId !== codexProjectMoveRuntimeId) return;
      window.__codexProjectMoveChatsSortTimer = null;
      applyChatsSortCorrection().catch((error) => {
        window.__codexProjectMoveSortFailures = window.__codexProjectMoveSortFailures || [];
        window.__codexProjectMoveSortFailures.push(String(error?.stack || error));
      }).finally(() => {
        if (codexPlusSettings().projectMove) scheduleChatsSortCorrection();
      });
    }, delay);
  }

  async function setProjectlessThreadIds(ref, mode) {
    const variants = threadIdVariants(ref.session_id);
    if (variants.length === 0) throw new Error("未找到会话 ID");
    const existingIds = await getCodexGlobalState("projectless-thread-ids").catch(() => []);
    const ids = Array.isArray(existingIds) ? existingIds : [];
    const variantSet = new Set(variants);
    const nextIds = mode === "add" ? uniqueValues([...ids, ...variants]) : ids.filter((id) => !variantSet.has(id));
    if (nextIds.length !== ids.length || nextIds.some((id, index) => id !== ids[index])) await setCodexGlobalState("projectless-thread-ids", nextIds);
  }

  async function clearThreadWorkspaceHints(ref) {
    const variants = threadIdVariants(ref.session_id);
    if (variants.length === 0) return;
    const hints = objectGlobalState(await getCodexGlobalState("thread-workspace-root-hints").catch(() => ({})));
    const hintKeys = variants.filter((id) => Object.prototype.hasOwnProperty.call(hints, id));
    if (hintKeys.length > 0) {
      hintKeys.forEach((id) => delete hints[id]);
      await setCodexGlobalState("thread-workspace-root-hints", hints);
    }
  }

  async function moveSessionToProjectless(ref) {
    if (!ref.session_id) throw new Error("未找到会话 ID");
    await setProjectlessThreadIds(ref, "add");
    await clearThreadWorkspaceHints(ref);
    const sortKey = await postJson("/thread-sort-key", ref).catch(() => ({}));
    return { status: "moved", session_id: ref.session_id, updated_at: sortKey?.updated_at, updated_at_ms: sortKey?.updated_at_ms, created_at_ms: sortKey?.created_at_ms };
  }

  function isNativeProjectTarget(target) {
    return target?.kind === "project" && nativeProjectTargets().some((project) => sameWorkspacePath(project.path, target.path));
  }

  async function moveSessionToProject(ref, target) {
    if (!ref.session_id) throw new Error("未找到会话 ID");
    if (!target?.path) throw new Error("目标项目路径为空");
    if (!isNativeProjectTarget(target)) throw new Error("目标项目不在 Codex 项目列表中");
    const result = await postJson("/move-thread-workspace", { ...ref, target_cwd: target.path });
    if (result.status !== "moved") throw new Error(result.message || "移动项目失败");
    await setProjectlessThreadIds(ref, "remove");
    await clearThreadWorkspaceHints(ref);
    return result;
  }

  function showToast(message, undoToken) {
    document.querySelectorAll(".codex-delete-toast").forEach((node) => node.remove());
    const toast = document.createElement("div");
    toast.className = "codex-delete-toast";
    toast.textContent = message;
    if (undoToken) {
      const undo = document.createElement("button");
      undo.textContent = "撤销";
      undo.addEventListener("click", async () => {
        const result = await postJson("/undo", { undo_token: undoToken });
        toast.textContent = result.message || "撤销完成";
        setTimeout(() => toast.remove(), 5000);
      });
      toast.appendChild(undo);
    }
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 10000);
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function confirmDelete(title) {
    document.querySelectorAll(".codex-delete-confirm-overlay").forEach((node) => node.remove());
    return new Promise((resolve) => {
      const overlay = document.createElement("div");
      overlay.className = "codex-delete-confirm-overlay";
      overlay.innerHTML = `
        <div class="codex-delete-confirm-content" role="dialog" aria-modal="true" aria-label="删除会话">
          <div class="codex-delete-confirm-title">删除会话</div>
          <div class="codex-delete-confirm-message">删除“${escapeHtml(title)}”？</div>
          <div class="codex-delete-confirm-actions">
            <button type="button" data-codex-delete-cancel="true">取消</button>
            <button type="button" data-codex-delete-confirm="true">删除</button>
          </div>
        </div>
      `;
      const finish = (value, event) => {
        event?.preventDefault();
        event?.stopPropagation();
        event?.target?.blur?.();
        overlay.remove();
        resolve(value);
      };
      overlay.addEventListener("click", (event) => {
        if (event.target === overlay || event.target.closest("[data-codex-delete-cancel]")) {
          finish(false, event);
          return;
        }
        if (event.target.closest("[data-codex-delete-confirm]")) {
          finish(true, event);
        }
      }, true);
      overlay.addEventListener("keydown", (event) => {
        if (event.key === "Escape") finish(false, event);
      }, true);
      document.body.appendChild(overlay);
      overlay.querySelector("[data-codex-delete-cancel]")?.focus();
    });
  }

  function defaultExportFilename(ref) {
    const title = String(ref.title || "Untitled session")
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 80)
      .replace(/[ .]+$/g, "") || "Untitled session";
    const sessionId = String(ref.session_id || "thread").replace(/[<>:"/\\|?*\x00-\x1f]/g, "-");
    return `${title}-${sessionId}.md`;
  }

  async function defaultExportDirectory() {
    const result = await postJson("/export-directory/default", {});
    return result?.path || "";
  }

  function promptExportDetails(defaultFilename, defaultDirectory) {
    document.querySelectorAll(".codex-delete-confirm-overlay").forEach((node) => node.remove());
    return new Promise((resolve) => {
      const overlay = document.createElement("div");
      overlay.className = "codex-delete-confirm-overlay";
      overlay.innerHTML = `
        <div class="codex-delete-confirm-content" role="dialog" aria-modal="true" aria-label="导出 Markdown">
          <div class="codex-delete-confirm-title">导出 Markdown</div>
          <div class="codex-delete-confirm-message">确认文件名和保存目录后导出。</div>
          <input class="codex-export-name-input" data-codex-export-name="true" value="${escapeHtml(defaultFilename)}" autocomplete="off">
          <div class="codex-export-directory-row">
            <input class="codex-export-name-input" data-codex-export-directory="true" value="${escapeHtml(defaultDirectory)}" autocomplete="off">
            <button type="button" class="codex-export-directory-button" data-codex-export-choose-directory="true">选择</button>
          </div>
          <div class="codex-delete-confirm-actions">
            <button type="button" data-codex-export-cancel="true">取消</button>
            <button type="button" data-codex-export-confirm="true">导出</button>
          </div>
        </div>
      `;
      const input = overlay.querySelector("[data-codex-export-name]");
      const directoryInput = overlay.querySelector("[data-codex-export-directory]");
      const finish = (value, event) => {
        event?.preventDefault();
        event?.stopPropagation();
        const filename = value ? String(input?.value || "").trim() : "";
        const exportDir = value ? String(directoryInput?.value || "").trim() : "";
        overlay.remove();
        resolve(filename ? { filename, exportDir } : null);
      };
      overlay.addEventListener("click", async (event) => {
        if (event.target === overlay || event.target.closest("[data-codex-export-cancel]")) {
          finish(false, event);
          return;
        }
        if (event.target.closest("[data-codex-export-choose-directory]")) {
          event.preventDefault();
          event.stopPropagation();
          const result = await postJson("/directory/choose", { initial_dir: directoryInput?.value || defaultDirectory });
          if (result?.status === "ok" && result.path && directoryInput) directoryInput.value = result.path;
          return;
        }
        if (event.target.closest("[data-codex-export-confirm]")) finish(true, event);
      }, true);
      overlay.addEventListener("keydown", (event) => {
        if (event.key === "Escape") finish(false, event);
        if (event.key === "Enter" && !event.target?.closest?.("[data-codex-export-directory]")) finish(true, event);
      }, true);
      document.body.appendChild(overlay);
      input?.focus();
      input?.select?.();
    });
  }

  function rowHref(row) {
    return row.getAttribute("href") || row.querySelector("a")?.getAttribute("href") || "";
  }

  function isCurrentSessionRow(row, ref) {
    if (row.getAttribute("aria-current") === "page" || row.getAttribute("aria-current") === "true") return true;
    const href = rowHref(row);
    if (href) {
      try {
        const url = new URL(href, window.location.href);
        if (url.href === window.location.href || url.pathname === window.location.pathname) return true;
      } catch {
        if (window.location.href.includes(href)) return true;
      }
    }
    return !!ref.session_id && window.location.href.includes(ref.session_id);
  }

  function releaseDeleteFocus(row, button) {
    button.blur();
    if (row.contains(document.activeElement)) {
      document.activeElement.blur();
    }
  }

  function removeDeletedRow(row, button, ref) {
    releaseDeleteFocus(row, button);
    const shouldReload = isCurrentSessionRow(row, ref);
    row.remove();
    if (shouldReload) {
      window.location.reload();
    }
  }

  function updateDeleteButtonOffsets() {
    sessionRows().forEach((row) => {
      const hasArchiveConfirm = Array.from(row.querySelectorAll("button")).some((button) => {
        const rect = button.getBoundingClientRect();
        const label = button.getAttribute("aria-label") || "";
        const text = (button.textContent || "").trim();
        if (button.classList.contains(buttonClass) || button.classList.contains(exportButtonClass) || label === "归档对话" || label === "置顶对话") return false;
        return text === "确认" || (text.length > 0 && rect.width > 0 && rect.width <= 36 && rect.x > row.getBoundingClientRect().right - 50);
      });
      row.classList.toggle("codex-archive-confirm-visible", hasArchiveConfirm);
    });
  }

  function openDeleteConfirmForRow(row, button, ref, event) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();
    releaseDeleteFocus(row, button);
    confirmDelete(ref.title).then(async (confirmed) => {
      if (!confirmed) return;
      releaseDeleteFocus(row, button);
      const result = await postJson("/delete", ref);
      if (result.status === "server_deleted" || result.status === "local_deleted") {
        removeDeletedRow(row, button, ref);
        showToast(result.message || "删除成功", result.undo_token);
      } else {
        showToast(result.message || "删除失败", null);
      }
    });
  }

  async function exportMarkdown(ref) {
    const details = await promptExportDetails(defaultExportFilename(ref), await defaultExportDirectory());
    if (!details) return;
    const result = await postJson("/export-markdown", { ...ref, filename: details.filename, export_dir: details.exportDir });
    if (result.status === "exported") {
      showToast("已导出到指定文件。", null);
      return;
    }
    showToast(result.message || "导出失败", null);
  }

  function sortStateFromMoveResult(result, ref, row) {
    const trustedSortMs = timestampMsFromPayload(result);
    return { sortMs: trustedSortMs || rowSortMs(row, ref), sortMsTrusted: !!trustedSortMs };
  }

  function finishProjectMove(row, button, ref, target, message) {
    releaseDeleteFocus(row, button);
    button.disabled = false;
    button.textContent = "移动";
    saveProjectMoveProjection(ref, target, target.sortMs || rowSortMs(row, ref, target));
    if (target.kind === "projectless") moveRowToChats(row, target);
    refreshAfterProjectMove();
    showToast(message, null);
  }

  async function applyProjectMove(row, button, ref, target) {
    button.disabled = true;
    button.textContent = "移动中";
    try {
      if (target.kind === "projectless") {
        const result = await moveSessionToProjectless(ref);
        finishProjectMove(row, button, ref, { ...target, ...sortStateFromMoveResult(result, ref, row) }, `已移动到普通对话：“${ref.title || ref.session_id}”`);
      } else {
        const result = await moveSessionToProject(ref, target);
        finishProjectMove(row, button, ref, { ...target, ...sortStateFromMoveResult(result, ref, row) }, `已移动到“${target.label}”：“${ref.title || ref.session_id}”`);
      }
    } catch (error) {
      button.disabled = false;
      button.textContent = "移动";
      showToast(`移动失败：${error?.message || error}`, null);
    }
  }

  function positionProjectMovePanel(panel, anchor) {
    const rect = anchor.getBoundingClientRect();
    const panelWidth = Math.min(360, Math.max(240, window.innerWidth - 32));
    panel.style.width = `${panelWidth}px`;
    panel.style.maxHeight = `${Math.max(180, window.innerHeight - 32)}px`;
    const panelHeight = Math.min(panel.scrollHeight || 360, window.innerHeight - 32);
    const left = Math.max(16, Math.min(window.innerWidth - panelWidth - 16, rect.right - panelWidth));
    let top = rect.bottom + 6;
    if (top + panelHeight > window.innerHeight - 16) top = rect.top - panelHeight - 6;
    top = Math.max(16, Math.min(window.innerHeight - panelHeight - 16, top));
    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
  }

  async function openProjectMoveMenuForRow(row, button, ref, event) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();
    releaseDeleteFocus(row, button);
    document.querySelectorAll(`.${projectMoveOverlayClass}`).forEach((node) => node.remove());
    const overlay = document.createElement("div");
    overlay.className = projectMoveOverlayClass;
    overlay.innerHTML = `
      <div class="codex-project-move-panel" role="dialog" aria-modal="true" aria-label="移动对话">
        <div class="codex-project-move-header">
          <div class="codex-project-move-title">移动“${escapeHtml(ref.title || ref.session_id)}”</div>
        </div>
        <div class="codex-project-move-list"><div class="codex-project-move-empty">加载项目中...</div></div>
      </div>
    `;
    const panel = overlay.querySelector(".codex-project-move-panel");
    const close = () => overlay.remove();
    overlay.addEventListener("click", (clickEvent) => {
      if (clickEvent.target === overlay) close();
    }, true);
    overlay.addEventListener("keydown", (keyEvent) => {
      if (keyEvent.key === "Escape") {
        keyEvent.preventDefault();
        close();
      }
    }, true);
    document.body.appendChild(overlay);
    positionProjectMovePanel(panel, button);
    try {
      const targets = projectMoveTargets();
      const list = overlay.querySelector(".codex-project-move-list");
      if (!list) return;
      list.innerHTML = "";
      if (targets.length === 0) {
        list.innerHTML = `<div class="codex-project-move-empty">没有可用目标</div>`;
        return;
      }
      for (const target of targets) {
        const item = document.createElement("button");
        item.type = "button";
        item.className = "codex-project-move-item";
        item.innerHTML = `
          <div class="codex-project-move-item-title">${escapeHtml(target.label)}</div>
          <div class="codex-project-move-item-path">${escapeHtml(target.description)}</div>
        `;
        item.addEventListener("click", async (selectEvent) => {
          selectEvent.preventDefault();
          selectEvent.stopPropagation();
          close();
          await applyProjectMove(row, button, ref, target);
        }, true);
        list.appendChild(item);
      }
      positionProjectMovePanel(panel, button);
      list.querySelector("button")?.focus();
    } catch (error) {
      close();
      showToast(`加载项目失败：${error?.message || error}`, null);
    }
  }

  function installDeleteButtonEventDelegation() {
    document.removeEventListener("pointerup", window.__codexSessionDeleteDocumentDeleteHandler, true);
    document.removeEventListener("click", window.__codexSessionDeleteDocumentDeleteHandler, true);
    const handler = (event) => {
      const button = event.target?.closest?.(`.${buttonClass}`);
      const row = button?.closest?.("[data-app-action-sidebar-thread-id]");
      if (!button || !row) return;
      const ref = sessionRefFromRow(row);
      if (!ref.session_id) return;
      openDeleteConfirmForRow(row, button, ref, event);
    };
    window.__codexSessionDeleteDocumentDeleteHandler = handler;
    document.addEventListener("pointerup", handler, true);
    document.addEventListener("click", handler, true);
  }

  function actionGroupFromRow(row) {
    return row.querySelector(`.${actionGroupClass}`);
  }

  function removeActionGroups(row) {
    row.querySelectorAll(`.${actionGroupClass}`).forEach((group) => group.remove());
  }

  function stopActionButtonEvent(row, button, event) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();
    releaseDeleteFocus(row, button);
  }

  function installActionButtonEvents(row, button, onActivate) {
    ["pointerdown", "mousedown", "mouseup", "touchstart"].forEach((eventName) => {
      button.addEventListener(eventName, (event) => stopActionButtonEvent(row, button, event), true);
    });
    button.addEventListener("pointerup", onActivate, true);
    button.addEventListener("click", onActivate, true);
  }

  function refreshActionButton(originalButton, row, onActivate) {
    if (!originalButton.isConnected) return;
    const replacement = originalButton.cloneNode(true);
    installActionButtonEvents(row, replacement, onActivate);
    originalButton.replaceWith(replacement);
  }

  function attachButton(row) {
    removeActionGroups(row);
    row.dataset.codexDeleteRow = "false";
    row.dataset.codexProjectMoveRow = "false";
  }

  function tryAttachButton(row) {
    try {
      attachButton(row);
    } catch (error) {
      window.__codexSessionDeleteAttachButtonFailures = window.__codexSessionDeleteAttachButtonFailures || [];
      window.__codexSessionDeleteAttachButtonFailures.push(String(error?.stack || error));
    }
  }

  function reactArchivedThreadFromNode(node) {
    const reactKey = Object.keys(node).find((key) => key.startsWith("__reactFiber$") || key.startsWith("__reactInternalInstance$"));
    let fiber = reactKey ? node[reactKey] : null;
    for (let depth = 0; fiber && depth < 20; depth += 1, fiber = fiber.return) {
      const props = fiber.memoizedProps || fiber.pendingProps || {};
      if (props.archivedThread?.id) return props.archivedThread;
      const childThread = props.children?.props?.archivedThread;
      if (childThread?.id) return childThread;
    }
    return null;
  }

  function archivedThreadFromRow(row) {
    for (const node of [row, ...row.querySelectorAll("*")]) {
      const thread = reactArchivedThreadFromNode(node);
      if (thread?.id || thread?.sessionId) return thread;
    }
    return null;
  }

  function archivedRefFromRow(row) {
    const archivedThread = archivedThreadFromRow(row);
    if (archivedThread?.id || archivedThread?.sessionId) {
      return { session_id: archivedThread.id || archivedThread.sessionId, title: archivedThread.title || row.querySelector(".truncate.text-base")?.textContent?.trim() || "Untitled session" };
    }
    const sidebarRef = sessionRefFromRow(row);
    if (sidebarRef.session_id) return sidebarRef;
    const titleNode = row.querySelector(".truncate.text-base, [data-thread-title], a, div");
    const title = ((titleNode || row).textContent || "Untitled session")
      .replace("取消归档", "")
      .replace("删除", "")
      .replace(/\d{4}年\d{1,2}月\d{1,2}日.*$/, "")
      .replace(/\s+·\s+.*$/, "")
      .trim()
      .slice(0, 160);
    return { session_id: "", title };
  }

  async function resolveArchivedThread(row) {
    const ref = archivedRefFromRow(row);
    if (ref.session_id) return ref;
    const resolved = await postJson("/archived-thread", { title: ref.title });
    return resolved?.session_id ? resolved : ref;
  }

  function stopArchivedButtonEvent(event) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();
  }

  function isArchiveTitleText(value) {
    return value === "已归档对话" || value === "Archived conversations";
  }

  function archiveTitleContainer() {
    const heading = Array.from(document.querySelectorAll("h1, h2, h3"))
      .find((element) => isArchiveTitleText((element.textContent || "").trim()));
    if (heading) return heading;
    return Array.from(document.querySelectorAll("h1, h2, h3, div, span"))
      .find((element) => isArchiveTitleText((element.textContent || "").trim()) && element.getBoundingClientRect().x > 350);
  }

  async function deleteArchivedSessions(rows) {
    let deleted = 0;
    for (const row of rows) {
      const ref = await resolveArchivedThread(row);
      if (!ref.session_id) continue;
      const result = await postJson("/delete", ref);
      if (result.status === "server_deleted" || result.status === "local_deleted") {
        row.remove();
        deleted += 1;
      }
    }
    showToast(`已删除 ${deleted} 个归档会话`, null);
  }

  function attachArchivedPageDeleteButton(row) {
    row.querySelectorAll("[data-codex-archive-row-action]").forEach((button) => button.remove());
    row.dataset.codexArchiveDeleteRow = "false";
  }

  function installArchivedDeleteAllButton() {
    const existingButton = document.querySelector("[data-codex-archive-delete-all]");
    existingButton?.remove();
  }

  function truncateTimelineQuestion(text) {
    const normalized = String(text || "").replace(/\s+/g, " ").trim();
    const chars = Array.from(normalized);
    if (chars.length <= timelineQuestionLimit) return normalized;
    return `${chars.slice(0, timelineQuestionLimit).join("")}…`;
  }

  function conversationTimelineRoot() {
    return document.querySelector(".thread-scroll-container") || document.querySelector("main") || document.querySelector('[role="main"]');
  }

  function timelineQuestionSelector() {
    return [
      '[data-message-author-role="user"]',
      '[data-testid="conversation-turn"][data-message-author-role="user"]',
      '[data-testid="conversation-turn"] [data-message-author-role="user"]',
      '[class*="user-message"]',
      '[class*="UserMessage"]',
    ].join(", ");
  }

  function nodeOrAncestorLooksLikeCodexUserBubble(node) {
    if (node.nodeType !== 1) return false;
    const className = String(node.className || "");
    if (className.includes("bg-token-foreground/5") && node.parentElement?.classList?.contains("items-end")) return true;
    const bubble = node.closest?.("[class*='bg-token-foreground/5']");
    return !!bubble?.parentElement?.classList?.contains("items-end");
  }

  function nodeLooksLikeCodexUserBubble(node) {
    if (nodeOrAncestorLooksLikeCodexUserBubble(node)) return true;
    return !!node.querySelector?.(".group.flex.w-full.flex-col.items-end.justify-end.gap-1 > [class*='bg-token-foreground/5']");
  }

  function nodeLooksLikeTimelineQuestion(node) {
    if (node.nodeType !== 1 || isExtensionUiNode(node)) return false;
    const questionSelector = timelineQuestionSelector();
    return !!node.matches?.(questionSelector) || !!node.closest?.(questionSelector) || !!node.querySelector?.(questionSelector) || nodeLooksLikeCodexUserBubble(node);
  }

  function conversationTimelineQuestionCandidates(root) {
    const explicitCandidates = Array.from(root.querySelectorAll([
      '[data-message-author-role="user"]',
      '[data-testid="conversation-turn"][data-message-author-role="user"]',
      '[data-testid="conversation-turn"] [data-message-author-role="user"]',
      '[class*="user-message"]',
      '[class*="UserMessage"]',
    ].join(", ")));
    const codexUserBubbles = Array.from(root.querySelectorAll(".group.flex.w-full.flex-col.items-end.justify-end.gap-1")).flatMap((group) => {
      return Array.from(group.children).filter((child) => String(child.className || "").includes("bg-token-foreground/5"));
    });
    return [...explicitCandidates, ...codexUserBubbles];
  }

  function extractTimelineQuestionText(node) {
    const clone = node.cloneNode(true);
    clone.querySelectorAll("button, svg, [aria-hidden='true'], .sr-only").forEach((child) => child.remove());
    return clone.textContent.replace(/\s+/g, " ").trim();
  }

  function timelineNodeId(node) {
    if (!node.__codexConversationTimelineNodeId) {
      window.__codexConversationTimelineNodeCounter += 1;
      node.__codexConversationTimelineNodeId = String(window.__codexConversationTimelineNodeCounter);
    }
    return node.__codexConversationTimelineNodeId;
  }

  function visibleTimelineNode(node) {
    if (!node.isConnected) return false;
    const style = getComputedStyle(node);
    if (style.display === "none" || style.visibility === "hidden") return false;
    const rect = node.getBoundingClientRect();
    return rect.width > 0 || rect.height > 0 || !!node.textContent?.trim();
  }

  function conversationTimelineQuestions() {
    const root = conversationTimelineRoot();
    if (!root?.matches?.('.thread-scroll-container, main, [role="main"]')) return [];
    const seen = new Set();
    return conversationTimelineQuestionCandidates(root).flatMap((node) => {
      if (node.closest('[data-app-action-sidebar-thread-id]')) return [];
      if (isExtensionUiNode(node)) return [];
      const target = node.closest('[data-testid="conversation-turn"]') || node;
      if (seen.has(target)) return [];
      seen.add(target);
      if (!visibleTimelineNode(target)) return [];
      const text = extractTimelineQuestionText(node);
      if (!text) return [];
      return [{ node: target, text, nodeId: timelineNodeId(target) }];
    });
  }

  function timelineScrollerViewportTop(scroller) {
    if (scroller === document.scrollingElement || scroller === document.documentElement || scroller === document.body) return 0;
    return scroller.getBoundingClientRect().top;
  }

  function timelineScrollableHeight(scroller) {
    return Math.max(1, scroller.scrollHeight - scroller.clientHeight);
  }

  function timelineRawMarkerTop(question, scroller) {
    const scrollOffset = scroller.scrollTop + question.node.getBoundingClientRect().top - timelineScrollerViewportTop(scroller);
    const percent = (scrollOffset / timelineScrollableHeight(scroller)) * 100;
    return Math.max(timelineMinTopPercent, Math.min(timelineMaxTopPercent, percent));
  }

  function timelineMarkerTops(questions, scroller) {
    if (questions.length <= 1) return [50];
    const minGap = Math.min(timelineMaxMarkerGapPercent, (timelineMaxTopPercent - timelineMinTopPercent) / Math.max(questions.length - 1, 1));
    const tops = questions.map((question) => timelineRawMarkerTop(question, scroller));
    for (let index = 1; index < tops.length; index += 1) {
      tops[index] = Math.max(tops[index], tops[index - 1] + minGap);
    }
    for (let index = tops.length - 1; index >= 0; index -= 1) {
      const maxForIndex = timelineMaxTopPercent - ((tops.length - 1 - index) * minGap);
      tops[index] = Math.min(tops[index], maxForIndex);
    }
    return tops.map((top) => Math.max(timelineMinTopPercent, Math.min(timelineMaxTopPercent, top)));
  }

  function removeConversationTimeline() {
    document.querySelectorAll(`.${timelineClass}`).forEach((node) => node.remove());
  }

  function nearestTimelineScroller(node) {
    for (let current = node?.parentElement; current; current = current.parentElement) {
      const style = getComputedStyle(current);
      if (/(auto|scroll)/.test(style.overflowY) && current.scrollHeight > current.clientHeight) return current;
    }
    return document.querySelector(".thread-scroll-container") || document.scrollingElement || document.documentElement;
  }

  function scrollTimelineTarget(node) {
    const scroller = nearestTimelineScroller(node);
    const nodeRect = node.getBoundingClientRect();
    const nextTop = scroller.scrollTop + nodeRect.top - timelineScrollerViewportTop(scroller) - (scroller.clientHeight / 2) + (nodeRect.height / 2);
    scroller.scrollTo({ top: nextTop, behavior: "smooth" });
  }

  function highlightTimelineTarget(node) {
    node.classList.remove(timelineTargetClass);
    void node.offsetWidth;
    node.classList.add(timelineTargetClass);
    clearTimeout(node.__codexConversationTimelineHighlightTimer);
    node.__codexConversationTimelineHighlightTimer = setTimeout(() => {
      node.classList.remove(timelineTargetClass);
    }, 1300);
  }

  function createConversationTimelineMarker(question) {
    const marker = document.createElement("button");
    marker.type = "button";
    marker.className = timelineMarkerClass;
    marker.dataset.codexConversationTimelineNodeId = question.nodeId;
    marker.style.top = `${question.markerTop}%`;
    marker.setAttribute("aria-label", `跳转到：${truncateTimelineQuestion(question.text)}`);
    const tooltip = document.createElement("span");
    tooltip.className = timelineTooltipClass;
    tooltip.id = `codex-conversation-timeline-tooltip-${question.nodeId}`;
    tooltip.setAttribute("role", "tooltip");
    tooltip.textContent = truncateTimelineQuestion(question.text);
    marker.setAttribute("aria-describedby", tooltip.id);
    marker.appendChild(tooltip);
    const activateMarker = (event) => {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
      document.querySelectorAll(`.${timelineMarkerClass}.codex-conversation-timeline-marker-active`).forEach((node) => {
        node.classList.remove("codex-conversation-timeline-marker-active");
      });
      marker.classList.add("codex-conversation-timeline-marker-active");
      scrollTimelineTarget(question.node);
      highlightTimelineTarget(question.node);
    };
    marker.addEventListener("pointerup", activateMarker, true);
    marker.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") activateMarker(event);
    }, true);
    return marker;
  }

  function timelineActiveQuestion(questions) {
    if (!questions.length) return null;
    const viewportCenter = window.innerHeight / 2;
    return questions.reduce((best, question) => {
      const rect = question.node.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const distance = Math.abs(center - viewportCenter);
      return !best || distance < best.distance ? { question, distance } : best;
    }, null)?.question || questions[0];
  }

  function updateTimelineActiveMarker() {
    const container = document.querySelector(`.${timelineClass}`);
    if (!container) return;
    const questions = conversationTimelineQuestions();
    const active = timelineActiveQuestion(questions);
    container.querySelectorAll(`.${timelineMarkerClass}`).forEach((marker) => {
      marker.classList.toggle("codex-conversation-timeline-marker-active", !!active && marker.dataset.codexConversationTimelineNodeId === active.nodeId);
    });
  }

  function conversationContentRight(questions, fallbackRoot) {
    const rects = questions
      .map((question) => question.node.getBoundingClientRect())
      .filter((rect) => rect.width > 120 && rect.height > 0);
    if (rects.length) {
      return Math.max(...rects.map((rect) => rect.right));
    }
    return fallbackRoot?.getBoundingClientRect?.().right || window.innerWidth - 36;
  }

  function positionConversationTimeline(container, questions) {
    const root = conversationTimelineRoot();
    const scroller = questions[0] ? nearestTimelineScroller(questions[0].node) : root;
    const scrollerRect = scroller?.getBoundingClientRect?.();
    const top = Math.max(76, (scrollerRect?.top || 72) + 10);
    const bottom = Math.max(24, window.innerHeight - (scrollerRect?.bottom || window.innerHeight) + 24);
    const height = Math.max(140, window.innerHeight - top - bottom);
    const contentRight = conversationContentRight(questions, root);
    const left = Math.max(320, Math.min(window.innerWidth - 34, contentRight + 8));
    container.style.setProperty("--codex-conversation-timeline-top", `${top}px`);
    container.style.setProperty("--codex-conversation-timeline-left", `${left}px`);
    container.style.setProperty("--codex-conversation-timeline-height", `${height}px`);
  }

  function bindConversationTimelineScroll(questions) {
    const scroller = questions[0] ? nearestTimelineScroller(questions[0].node) : null;
    if (window.__codexConversationTimelineScroller && window.__codexConversationTimelineScrollHandler) {
      window.__codexConversationTimelineScroller.removeEventListener("scroll", window.__codexConversationTimelineScrollHandler, true);
    }
    if (!scroller) return;
    let rafId = 0;
    const handler = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateTimelineActiveMarker);
    };
    window.__codexConversationTimelineScroller = scroller;
    window.__codexConversationTimelineScrollHandler = handler;
    scroller.addEventListener("scroll", handler, true);
  }

  function prepareTimelineQuestions(questions) {
    if (questions.length === 0) return [];
    const scroller = nearestTimelineScroller(questions[0].node);
    const tops = timelineMarkerTops(questions, scroller);
    return questions.map((question, index) => ({ ...question, markerTop: Number(tops[index].toFixed(3)) }));
  }

  function timelineSignature(questions) {
    return questions.map((question) => `${question.nodeId}:${Math.round(question.markerTop * 10)}:${truncateTimelineQuestion(question.text)}`).join("|");
  }

  function refreshConversationTimeline() {
    if (!codexPlusSettings().conversationTimeline) {
      removeConversationTimeline();
      return;
    }
    const questions = prepareTimelineQuestions(conversationTimelineQuestions());
    if (questions.length === 0) {
      removeConversationTimeline();
      return;
    }
    const signature = timelineSignature(questions);
    const existing = document.querySelector(`.${timelineClass}`);
    if (
      existing?.dataset.codexConversationTimelineVersion === codexConversationTimelineVersion &&
      existing?.dataset.codexConversationTimelineSignature === signature
    ) {
      positionConversationTimeline(existing, questions);
      updateTimelineActiveMarker();
      return;
    }
    removeConversationTimeline();
    const container = document.createElement("div");
    container.className = timelineClass;
    container.dataset.codexConversationTimelineVersion = codexConversationTimelineVersion;
    container.dataset.codexConversationTimelineSignature = signature;
    const track = document.createElement("div");
    track.className = timelineTrackClass;
    container.appendChild(track);
    questions.forEach((question) => {
      container.appendChild(createConversationTimelineMarker(question));
    });
    document.body.appendChild(container);
    positionConversationTimeline(container, questions);
    bindConversationTimelineScroll(questions);
    updateTimelineActiveMarker();
  }

  function scanLightweight() {
    installStyle();
    removeTopCodexPlusMenu();
    installCodexPlusComposerBar();
    scheduleBackendHeartbeat();
  }

  function scanDeferred() {
    enablePluginEntry();
    unblockPluginInstallButtons();
    sessionRows().forEach(tryAttachButton);
    scheduleProjectMoveProjection();
    scheduleChatsSortCorrection();
    archivedPageRows().forEach((row) => attachArchivedPageDeleteButton(row));
    installArchivedDeleteAllButton();
    refreshConversationTimeline();
  }

  function runScanStep(step) {
    try {
      step();
    } catch (error) {
      window.__codexSessionDeleteScanFailures = window.__codexSessionDeleteScanFailures || [];
      window.__codexSessionDeleteScanFailures.push(String(error?.stack || error));
    }
  }

  function scan() {
    runScanStep(scanLightweight);
    requestAnimationFrame(() => runScanStep(scanDeferred));
  }

  function isExtensionUiNode(node) {
    return !!node?.closest?.(`.codex-delete-toast, .codex-delete-confirm-overlay, .codex-plus-modal-overlay, .${projectMoveOverlayClass}, .${timelineClass}, .codex-conversation-timeline, .${codexPlusActionsMenuClass}, #${codexPlusComposerId}, #codex-plus-menu`);
  }

  const scanRelevantSelector = [
    selectors.sidebarThread,
    '[data-app-action-sidebar-section-heading="Chats"]',
    '[data-app-action-sidebar-section-heading="Projects"]',
    '[data-codex-project-move-row="true"]',
    '[data-codex-archive-page-row="true"]',
    "[data-codex-archive-delete-all]",
    '[data-message-author-role]',
    '[data-testid="conversation-turn"]',
    '[class*="user-message"]',
    '[class*="UserMessage"]',
    selectors.appHeader,
    selectors.archiveNav,
    selectors.disabledInstallButton,
    "textarea",
    "[contenteditable='true']",
    "[role='textbox']",
  ].join(", ");

  function nodeSelfOrAncestorMatchesScanRelevance(node) {
    if (node.nodeType !== 1) return false;
    if (isExtensionUiNode(node)) return false;
    const questionSelector = timelineQuestionSelector();
    return !!node.matches?.(scanRelevantSelector) ||
      !!node.closest?.(scanRelevantSelector) ||
      !!node.matches?.(questionSelector) ||
      !!node.closest?.(questionSelector) ||
      nodeOrAncestorLooksLikeCodexUserBubble(node);
  }

  function isScanRelevantNode(node) {
    if (node.nodeType !== 1) return false;
    if (isExtensionUiNode(node)) return false;
    return nodeSelfOrAncestorMatchesScanRelevance(node) || !!node.querySelector?.(scanRelevantSelector) || nodeLooksLikeTimelineQuestion(node);
  }

  function isChatContentMutation(mutation) {
    const target = mutation.target;
    if (!target?.closest?.('[data-message-author-role], [data-testid="conversation-turn"], main .prose')) return false;
    return !Array.from(mutation.addedNodes).some((node) => node.nodeType === 1 && isScanRelevantNode(node)) &&
      !Array.from(mutation.removedNodes).some((node) => node.nodeType === 1 && isScanRelevantNode(node));
  }

  function shouldScheduleScan(mutations) {
    if (!mutations) return true;
    return mutations.some((mutation) => {
      if (isChatContentMutation(mutation)) return false;
      const target = mutation.target;
      if (isExtensionUiNode(target)) return false;
      if (target?.nodeType === 1 && nodeSelfOrAncestorMatchesScanRelevance(target)) return true;
      const changedNodes = [...Array.from(mutation.addedNodes), ...Array.from(mutation.removedNodes)];
      return changedNodes.some((node) => node.nodeType === 1 && isScanRelevantNode(node));
    });
  }

  function runScheduledScan() {
    window.__codexSessionDeleteScanPending = false;
    clearTimeout(window.__codexSessionDeleteScanTimer);
    window.__codexSessionDeleteScanTimer = null;
    scan();
  }

  function scheduleScan(mutations) {
    if (!shouldScheduleScan(mutations)) return;
    if (window.__codexSessionDeleteScanPending) return;
    window.__codexSessionDeleteScanPending = true;
    window.__codexSessionDeleteScanTimer = setTimeout(runScheduledScan, 200);
  }

  scan();
  window.__codexProjectMoveApplyProjection = applyProjectMoveProjection;
  window.__codexProjectMoveReadProjection = readProjectMoveProjection;
  window.__codexProjectMoveTargets = projectMoveTargets;
  window.__codexProjectMoveSortChats = applyChatsSortCorrection;
  window.removeEventListener("resize", window.__codexPlusResizeHandler);
  let codexPlusResizeRafId = 0;
  window.__codexPlusResizeHandler = () => {
    cancelAnimationFrame(codexPlusResizeRafId);
    codexPlusResizeRafId = requestAnimationFrame(() => {
      updateFloatingCodexPlusMenuPosition(document.getElementById(codexPlusMenuId));
      runScanStep(refreshConversationTimeline);
    });
  };
  window.addEventListener("resize", window.__codexPlusResizeHandler);
  window.__codexSessionDeleteObserver?.disconnect();
  window.__codexSessionDeleteObserver = new MutationObserver(scheduleScan);
  window.__codexSessionDeleteObserver.observe(document.body || document.documentElement, { childList: true, subtree: true });
})();
