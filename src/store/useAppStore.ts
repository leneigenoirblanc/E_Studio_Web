/**
 * Centralized Zustand Domain & Application State Store
 * 
 * Replaces ad-hoc useState hooks with a unified, predictable domain store:
 * - Templates management (persisted via TemplateRepository)
 * - Product catalog & Turso cloud sync status
 * - Mobile scan lots and batch ingestion
 * - Modal & navigation orchestrations
 * - Local-First reactive subscriptions
 */

import { create } from 'zustand';
import { LabelTemplate, ProductRecord } from '../types';
import { DEFAULT_TEMPLATES } from '../defaultTemplates';
import { navigationService, AppView } from '../services/navigationService';
import { databaseService, TursoConfig } from '../services/databaseService';
import { templateRepository } from '../domain/repositories';
import { mobileSyncService, MobileScanLot } from '../pwa';
import { mappingDictionaryManager, FieldAliasDefinition } from '../utils/mappingDictionary';

export type AppModalKey =
  | 'isWizardOpen'
  | 'isRulesModalOpen'
  | 'isFontManagerOpen'
  | 'isAuditTrailOpen'
  | 'isMappingDictionaryOpen'
  | 'isMobileSyncOpen'
  | 'isPreferencesModalOpen'
  | 'isFindReplaceOpen'
  | 'isShortcutsOpen'
  | 'isCalibrationOpen'
  | 'isDataMappingOpen';

export interface NavigationHistoryEntry {
  view: AppView;
  params?: Record<string, string>;
  title?: string;
  timestamp: number;
}

export interface SyncStatus {
  isOnline: boolean;
  lastSyncedAt: number | null;
  isSyncing: boolean;
  tursoConnected: boolean;
}

export interface AppState {
  // Domain: Templates
  templates: LabelTemplate[];
  activeTemplate: LabelTemplate | null;

  // Domain: Catalog & Cloud DB
  totalProductsCount: number;
  tursoConfig: TursoConfig;

  // Domain: Mapping Dictionary
  dictionary: FieldAliasDefinition[];

  // Domain: Mobile Lots & Synchronization
  mobileLots: MobileScanLot[];
  pendingLotsCount: number;
  mobileInitialProducts: ProductRecord[] | undefined;
  mobileInitialBatchName: string | undefined;
  syncStatus: SyncStatus;

  // Shell: Routing & View Navigation History
  currentView: AppView;
  navigationHistory: NavigationHistoryEntry[];
  historyIndex: number;
  canGoBack: boolean;
  canGoForward: boolean;

  // Shell: Modals State
  modals: Record<AppModalKey, boolean>;

  // Synchronous State Updaters
  setTemplates: (templates: LabelTemplate[]) => void;
  setActiveTemplate: (template: LabelTemplate | null) => void;
  setCurrentView: (view: AppView) => void;
  setTotalProductsCount: (count: number) => void;
  setTursoConfig: (config: TursoConfig) => void;
  setDictionary: (dict: FieldAliasDefinition[]) => void;
  setMobileLots: (lots: MobileScanLot[]) => void;
  setMobileInitialData: (products?: ProductRecord[], batchName?: string) => void;
  setModalOpen: (modalKey: AppModalKey, isOpen: boolean) => void;
  openModal: (modalKey: AppModalKey) => void;
  closeModal: (modalKey: AppModalKey) => void;

  // Domain Workflow Actions
  navigateTo: (view: AppView, params?: Record<string, string>, title?: string) => void;
  goBack: () => void;
  goForward: () => void;
  selectToEdit: (tpl: LabelTemplate) => void;
  selectToGenerate: (tpl: LabelTemplate) => void;
  generateFromMobileLot: (lot: MobileScanLot) => ProductRecord[];
  generateFromDatabase: (products: ProductRecord[]) => void;
  saveTemplate: (tpl: LabelTemplate) => Promise<void>;
  createNewTemplate: (tpl: LabelTemplate) => Promise<void>;
  duplicateTemplate: (name: string) => Promise<LabelTemplate | null>;
  deleteTemplate: (name: string) => Promise<void>;
  importTemplate: (tpl: LabelTemplate) => Promise<LabelTemplate>;
  updateDictionaryField: (key: string, updatedData: any) => { success: boolean; message?: string };
  resetDictionaryToDefaults: () => void;

  // Lifecycle Subscriptions Hook
  initSubscriptions: () => () => void;
}

export const useAppStore = create<AppState>((set, get) => {
  // Initial state calculation safely
  const initialTemplates = templateRepository.getAll();
  const currentRoute = navigationService.getCurrentRoute();
  
  let initialActiveTemplate: LabelTemplate | null = null;
  if (currentRoute.params.template) {
    initialActiveTemplate = templateRepository.getByName(currentRoute.params.template) || null;
  }
  if (!initialActiveTemplate) {
    initialActiveTemplate = initialTemplates[0] || DEFAULT_TEMPLATES[0] || null;
  }

  const initialLots = mobileSyncService.getLots();
  const initialPendingCount = initialLots.filter(
    (l) => l.status === 'ready' || l.status === 'received'
  ).length;

  const initialTursoConfig = databaseService.getTursoConfig();

  return {
    // Initial State
    templates: initialTemplates,
    activeTemplate: initialActiveTemplate,
    totalProductsCount: databaseService.getProducts().length,
    tursoConfig: initialTursoConfig,
    dictionary: mappingDictionaryManager.getDictionary(),
    mobileLots: initialLots,
    pendingLotsCount: initialPendingCount,
    mobileInitialProducts: undefined,
    mobileInitialBatchName: undefined,
    syncStatus: {
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      lastSyncedAt: initialTursoConfig.lastSyncedAt,
      isSyncing: initialTursoConfig.status === 'syncing',
      tursoConnected: initialTursoConfig.enabled && initialTursoConfig.status === 'connected',
    },
    currentView: currentRoute.view,
    navigationHistory: [
      {
        view: currentRoute.view,
        params: currentRoute.params,
        title: currentRoute.view,
        timestamp: Date.now(),
      },
    ],
    historyIndex: 0,
    canGoBack: false,
    canGoForward: false,
    modals: {
      isWizardOpen: false,
      isRulesModalOpen: false,
      isFontManagerOpen: false,
      isAuditTrailOpen: false,
      isMappingDictionaryOpen: false,
      isMobileSyncOpen: false,
      isPreferencesModalOpen: false,
      isFindReplaceOpen: false,
      isShortcutsOpen: false,
      isCalibrationOpen: false,
      isDataMappingOpen: false,
    },

    // Synchronous Setters
    setTemplates: (templates) => set({ templates }),
    setActiveTemplate: (activeTemplate) => set({ activeTemplate }),
    setCurrentView: (currentView) => set({ currentView }),
    setTotalProductsCount: (totalProductsCount) => set({ totalProductsCount }),
    setTursoConfig: (tursoConfig) =>
      set((state) => ({
        tursoConfig,
        syncStatus: {
          ...state.syncStatus,
          lastSyncedAt: tursoConfig.lastSyncedAt,
          isSyncing: tursoConfig.status === 'syncing',
          tursoConnected: tursoConfig.enabled && tursoConfig.status === 'connected',
        },
      })),
    setDictionary: (dictionary) => {
      mappingDictionaryManager.setFullDictionary(dictionary);
      set({ dictionary });
    },
    updateDictionaryField: (key, updatedData) => {
      const res = mappingDictionaryManager.updateField(key, updatedData);
      set({ dictionary: mappingDictionaryManager.getDictionary() });
      return res;
    },
    resetDictionaryToDefaults: () => {
      mappingDictionaryManager.resetToDefaults();
      set({ dictionary: mappingDictionaryManager.getDictionary() });
    },
    setMobileLots: (mobileLots) => {
      const pendingLotsCount = mobileLots.filter(
        (l) => l.status === 'ready' || l.status === 'received'
      ).length;
      set({ mobileLots, pendingLotsCount });
    },
    setMobileInitialData: (products, batchName) =>
      set({ mobileInitialProducts: products, mobileInitialBatchName: batchName }),

    // Modal Orchestration
    setModalOpen: (modalKey, isOpen) =>
      set((state) => ({
        modals: { ...state.modals, [modalKey]: isOpen },
      })),
    openModal: (modalKey) =>
      set((state) => ({
        modals: { ...state.modals, [modalKey]: true },
      })),
    closeModal: (modalKey) =>
      set((state) => ({
        modals: { ...state.modals, [modalKey]: false },
      })),

    // Domain Actions
    navigateTo: (view, params, title) => {
      const state = get();
      let tplName = state.activeTemplate?.name;
      if ((view === 'editor' || view === 'generation') && !state.activeTemplate) {
        const defaultTpl = state.templates[0] || DEFAULT_TEMPLATES[0];
        set({ activeTemplate: defaultTpl });
        tplName = defaultTpl?.name;
      }
      const effectiveParams = tplName ? { template: tplName, ...params } : params;
      navigationService.navigateTo(view, effectiveParams);

      const newEntry: NavigationHistoryEntry = {
        view,
        params: effectiveParams,
        title: title || view,
        timestamp: Date.now(),
      };

      const truncatedHistory = state.navigationHistory.slice(0, state.historyIndex + 1);
      const last = truncatedHistory[truncatedHistory.length - 1];
      const isSameAsLast =
        last &&
        last.view === view &&
        JSON.stringify(last.params || {}) === JSON.stringify(effectiveParams || {});

      const newHistory = isSameAsLast ? truncatedHistory : [...truncatedHistory, newEntry];
      const newIndex = newHistory.length - 1;

      set({
        currentView: view,
        navigationHistory: newHistory,
        historyIndex: newIndex,
        canGoBack: newIndex > 0,
        canGoForward: false,
      });
    },

    goBack: () => {
      const state = get();
      if (state.historyIndex > 0) {
        const nextIndex = state.historyIndex - 1;
        const target = state.navigationHistory[nextIndex];
        if (target) {
          navigationService.navigateTo(target.view, target.params, true);
          set({
            currentView: target.view,
            historyIndex: nextIndex,
            canGoBack: nextIndex > 0,
            canGoForward: nextIndex < state.navigationHistory.length - 1,
          });
        }
      }
    },

    goForward: () => {
      const state = get();
      if (state.historyIndex < state.navigationHistory.length - 1) {
        const nextIndex = state.historyIndex + 1;
        const target = state.navigationHistory[nextIndex];
        if (target) {
          navigationService.navigateTo(target.view, target.params, true);
          set({
            currentView: target.view,
            historyIndex: nextIndex,
            canGoBack: nextIndex > 0,
            canGoForward: nextIndex < state.navigationHistory.length - 1,
          });
        }
      }
    },

    selectToEdit: (tpl) => {
      set({ activeTemplate: tpl });
      get().navigateTo('editor', { template: tpl.name }, `Éditeur: ${tpl.name}`);
    },

    selectToGenerate: (tpl) => {
      const snapshot: LabelTemplate = JSON.parse(JSON.stringify(tpl));
      set({
        activeTemplate: snapshot,
        mobileInitialProducts: undefined,
        mobileInitialBatchName: undefined,
      });
      get().navigateTo('generation', { template: tpl.name }, `Tirage: ${tpl.name}`);
    },

    generateFromMobileLot: (lot) => {
      const state = get();
      const matchedTemplate =
        state.templates.find((t) => t.name === lot.targetTemplateId) ||
        state.templates[0] ||
        DEFAULT_TEMPLATES[0];

      const records = mobileSyncService.convertLotToProductRecords(lot);
      const snapshot: LabelTemplate = JSON.parse(JSON.stringify(matchedTemplate));

      set({
        activeTemplate: snapshot,
        mobileInitialProducts: records,
        mobileInitialBatchName: lot.name,
      });

      get().navigateTo(
        'generation',
        {
          template: matchedTemplate.name,
          lot: lot.id,
        },
        `Lot: ${lot.name}`
      );

      return records;
    },

    generateFromDatabase: (products) => {
      const state = get();
      const defaultTemplate = state.templates[0] || DEFAULT_TEMPLATES[0];
      const snapshot: LabelTemplate = JSON.parse(JSON.stringify(defaultTemplate));

      set({
        activeTemplate: snapshot,
        mobileInitialProducts: products,
        mobileInitialBatchName: `Impression Base de Données (${products.length} réf.)`,
      });

      get().navigateTo('generation', { template: defaultTemplate.name }, 'Base de Données');
    },

    saveTemplate: async (tpl) => {
      await templateRepository.save(tpl);
      const updatedList = templateRepository.getAll();
      set({
        templates: updatedList,
        activeTemplate: tpl,
      });
    },

    createNewTemplate: async (newTpl) => {
      await templateRepository.save(newTpl);
      const updatedList = templateRepository.getAll();
      set({
        templates: updatedList,
        activeTemplate: newTpl,
      });
      get().navigateTo('editor', { template: newTpl.name }, `Nouveau: ${newTpl.name}`);
    },

    duplicateTemplate: async (name) => {
      const cloned = await templateRepository.duplicate(name);
      if (cloned) {
        const updatedList = templateRepository.getAll();
        set({ templates: updatedList });
      }
      return cloned;
    },

    deleteTemplate: async (name) => {
      await templateRepository.delete(name);
      const remaining = templateRepository.getAll();
      const state = get();
      let nextActive = state.activeTemplate;

      if (state.activeTemplate?.name === name) {
        nextActive = remaining[0] || null;
        get().navigateTo('home', {}, "Vue d'ensemble");
      }

      set({
        templates: remaining,
        activeTemplate: nextActive,
      });
    },

    importTemplate: async (imported) => {
      let uniqueName = imported.name;
      let counter = 2;
      while (templateRepository.getByName(uniqueName)) {
        uniqueName = `${imported.name} (${counter++})`;
      }
      imported.name = uniqueName;

      await templateRepository.save(imported);
      const updatedList = templateRepository.getAll();
      set({
        templates: updatedList,
        activeTemplate: imported,
      });
      get().navigateTo('editor', { template: imported.name }, `Import: ${imported.name}`);
      return imported;
    },

    // Reactive Subscriptions to external services
    initSubscriptions: () => {
      // 1. Template Repository reactive sync
      const unsubTemplates = templateRepository.subscribe((list) => {
        set({ templates: list });
      });

      // 2. Navigation route sync
      const unsubNav = navigationService.subscribe((route) => {
        set({ currentView: route.view });
        if (route.params.template) {
          const found = templateRepository.getByName(route.params.template);
          if (found) {
            set({ activeTemplate: found });
          }
        }
      });

      // 3. Mobile lots sync
      const unsubLots = mobileSyncService.subscribe((lots) => {
        const pendingCount = lots.filter(
          (l) => l.status === 'ready' || l.status === 'received'
        ).length;
        set({ mobileLots: lots, pendingLotsCount: pendingCount });
      });

      // 4. Database & Turso sync
      const unsubDb = databaseService.subscribe((prods) => {
        const config = databaseService.getTursoConfig();
        set((state) => ({
          totalProductsCount: prods.length,
          tursoConfig: config,
          syncStatus: {
            ...state.syncStatus,
            lastSyncedAt: config.lastSyncedAt,
            isSyncing: config.status === 'syncing',
            tursoConnected: config.enabled && config.status === 'connected',
          },
        }));
      });

      // 5. Online/Offline events
      const handleOnline = () =>
        set((state) => ({ syncStatus: { ...state.syncStatus, isOnline: true } }));
      const handleOffline = () =>
        set((state) => ({ syncStatus: { ...state.syncStatus, isOnline: false } }));

      if (typeof window !== 'undefined') {
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
      }

      // 6. Mapping dictionary reactive sync
      const unsubDictionary = mappingDictionaryManager.subscribe(() => {
        set({ dictionary: mappingDictionaryManager.getDictionary() });
      });

      // Cleanup function
      return () => {
        unsubTemplates();
        unsubNav();
        unsubLots();
        unsubDb();
        unsubDictionary();
        if (typeof window !== 'undefined') {
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('offline', handleOffline);
        }
      };
    },
  };
});

export default useAppStore;
