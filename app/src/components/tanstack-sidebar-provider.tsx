import React from "react";
import { useSidebarState, type SidebarStateType } from "../features/layout/hooks/use-sidebar-state";
import { keyboardShortcutsHelpers } from "../features/keyboard/collections/keyboard-shortcuts-collection";
import useIsMobile from "@anole/ui/hooks/use-mobile";

// Context for sidebar state management
type TanStackSidebarContextProperties<T extends string> = {
  isMobile: boolean;
  setSidebarState: (
    name: T,
    state: Partial<SidebarStateType> | ((previous: SidebarStateType) => Partial<SidebarStateType>),
  ) => void;
  sidebars: Record<T, SidebarStateType>;
  toggleSidebar: (name: T) => void;
};

const TanStackSidebarContext = React.createContext<TanStackSidebarContextProperties<any> | null>(null);

// Hook to use the TanStack sidebar context
export const useTanStackSidebar = <T extends string>(name: T) => {
  const context = React.use(TanStackSidebarContext);

  if (!context) {
    throw new Error("useTanStackSidebar must be used within a TanStackSidebarProvider.");
  }

  const sidebarState = context.sidebars[name] ?? {
    isMobileOpen: false,
    isOpen: false,
  };

  return {
    ...sidebarState,
    isMobile: context.isMobile,
    setState: (state: Partial<SidebarStateType>) => context.setSidebarState(name, state),
    toggle: () => context.toggleSidebar(name),
  };
};

interface TanStackSidebarProviderProperties<T extends string> {
  children: React.ReactNode;
  className?: string;
  defaultOpen?: "all" | T[];
  sidebarNames: ReadonlyArray<T>;
  style?: React.CSSProperties;
  onOpenChange?: (open: T[]) => void;
  open?: T[];
}

export const TanStackSidebarProvider = <T extends string>({
  children,
  className,
  defaultOpen = "all",
  sidebarNames,
  style,
  onOpenChange,
  open: openProperty,
  ...properties
}: TanStackSidebarProviderProperties<T> & React.ComponentProps<"div">) => {
  const isMobile = useIsMobile();
  const { 
    sidebarStates, 
    toggleSidebar, 
    setSidebarState, 
    initializeSidebarStates,
    getOpenSidebarNames 
  } = useSidebarState(sidebarNames);

  // Initialize sidebar states on mount
  React.useEffect(() => {
    const currentStates = Object.keys(sidebarStates);
    const needsInitialization = sidebarNames.some(name => !currentStates.includes(name));
    
    if (needsInitialization) {
      initializeSidebarStates(defaultOpen);
    }
  }, [sidebarNames, defaultOpen, initializeSidebarStates, sidebarStates]);

  // Handle controlled open state
  React.useEffect(() => {
    if (openProperty) {
      sidebarNames.forEach((name) => {
        const shouldBeOpen = openProperty.includes(name);
        const currentlyOpen = sidebarStates[name]?.isOpen ?? false;
        
        if (shouldBeOpen !== currentlyOpen) {
          setSidebarState(name, { isOpen: shouldBeOpen });
        }
      });
    }
  }, [openProperty, sidebarNames, setSidebarState, sidebarStates]);

  // Call onOpenChange when sidebar states change
  React.useEffect(() => {
    if (onOpenChange) {
      const openSidebarNames = getOpenSidebarNames();
      onOpenChange(openSidebarNames);
    }
  }, [sidebarStates, onOpenChange, getOpenSidebarNames]);

  // Mobile state management (separate from persistent state)
  const [mobileStates, setMobileStates] = React.useState<Record<T, boolean>>({} as Record<T, boolean>);

  const enhancedToggleSidebar = React.useCallback((name: T) => {
    if (isMobile) {
      // On mobile, toggle mobile state instead of persistent state
      setMobileStates(prev => ({
        ...prev,
        [name]: !prev[name],
      }));
    } else {
      // On desktop, toggle persistent state
      toggleSidebar(name);
    }
  }, [isMobile, toggleSidebar]);

  const enhancedSetSidebarState = React.useCallback((
    name: T,
    state: Partial<SidebarStateType> | ((previous: SidebarStateType) => Partial<SidebarStateType>)
  ) => {
    const currentSidebarState = {
      ...sidebarStates[name],
      isMobileOpen: mobileStates[name] ?? false,
    };
    
    const newState = typeof state === 'function' ? state(currentSidebarState) : state;
    
    // Handle mobile state separately
    if ('isMobileOpen' in newState && newState.isMobileOpen !== undefined) {
      setMobileStates(prev => ({
        ...prev,
        [name]: newState.isMobileOpen!,
      }));
    }
    
    // Handle persistent state
    if ('isOpen' in newState && newState.isOpen !== undefined && !isMobile) {
      setSidebarState(name, { isOpen: newState.isOpen });
    }
  }, [sidebarStates, mobileStates, setSidebarState, isMobile]);

  // Enhanced sidebar states that include mobile state
  const enhancedSidebarStates = React.useMemo(() => {
    const enhanced: Record<T, SidebarStateType> = {} as Record<T, SidebarStateType>;
    
    sidebarNames.forEach((name) => {
      enhanced[name] = {
        isOpen: sidebarStates[name]?.isOpen ?? false,
        isMobileOpen: mobileStates[name] ?? false,
      };
    });
    
    return enhanced;
  }, [sidebarStates, mobileStates, sidebarNames]);

  // Keyboard shortcuts handling
  React.useEffect(() => {
    const shortcuts = keyboardShortcutsHelpers.getCurrentShortcuts();

    const handleKeyDown = (event: KeyboardEvent) => {
      // Handle sidebar left shortcut
      if (keyboardShortcutsHelpers.matchesShortcut(event, shortcuts.sidebarLeft)) {
        event.preventDefault();
        const leftSidebar = sidebarNames.find(name => name === 'left' || name.includes('left'));
        if (leftSidebar) {
          enhancedToggleSidebar(leftSidebar);
        }
      }

      // Handle sidebar right shortcut
      if (keyboardShortcutsHelpers.matchesShortcut(event, shortcuts.sidebarRight)) {
        event.preventDefault();
        const rightSidebar = sidebarNames.find(name => name === 'right' || name.includes('right'));
        if (rightSidebar) {
          enhancedToggleSidebar(rightSidebar);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [sidebarNames, enhancedToggleSidebar]);

  const contextValue = React.useMemo<TanStackSidebarContextProperties<T>>(() => {
    return {
      isMobile,
      setSidebarState: enhancedSetSidebarState,
      sidebars: enhancedSidebarStates,
      toggleSidebar: enhancedToggleSidebar,
    };
  }, [enhancedSidebarStates, enhancedSetSidebarState, enhancedToggleSidebar, isMobile]);

  return (
    <TanStackSidebarContext value={contextValue}>
      <div
        className={className}
        style={{
          "--sidebar-width": "16rem",
          "--sidebar-width-icon": "3rem",
          ...style,
        } as React.CSSProperties}
        {...properties}
      >
        {children}
      </div>
    </TanStackSidebarContext>
  );
};