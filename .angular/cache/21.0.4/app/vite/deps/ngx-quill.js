import {
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR
} from "./chunk-Z4RX7BFE.js";
import {
  DomSanitizer
} from "./chunk-44QFU4KS.js";
import "./chunk-6GJD7UNI.js";
import {
  isPlatformServer
} from "./chunk-KHSFNPL7.js";
import "./chunk-S24ENL7S.js";
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Directive,
  ElementRef,
  EventEmitter,
  Injectable,
  InjectionToken,
  Input,
  NgModule,
  Output,
  PLATFORM_ID,
  Renderer2,
  SecurityContext,
  ViewEncapsulation,
  afterNextRender,
  assertInInjectionContext,
  booleanAttribute,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  makeEnvironmentProviders,
  setClassMetadata,
  signal,
  ɵɵInheritDefinitionFeature,
  ɵɵProvidersFeature,
  ɵɵadvance,
  ɵɵclassMap,
  ɵɵconditional,
  ɵɵconditionalCreate,
  ɵɵdefineComponent,
  ɵɵdefineDirective,
  ɵɵdefineInjectable,
  ɵɵdefineInjector,
  ɵɵdefineNgModule,
  ɵɵdomElement,
  ɵɵdomElementEnd,
  ɵɵdomElementStart,
  ɵɵdomProperty,
  ɵɵgetInheritedFactory,
  ɵɵprojection,
  ɵɵprojectionDef,
  ɵɵsanitizeHtml
} from "./chunk-REQEA3YI.js";
import {
  Observable,
  Subscription,
  debounceTime,
  defer,
  forkJoin,
  fromEvent,
  isObservable,
  map,
  mergeMap,
  of,
  shareReplay,
  takeUntil,
  tap
} from "./chunk-MTGAPTAR.js";
import "./chunk-XBB75M5E.js";
import {
  __async
} from "./chunk-QXFS4N4X.js";

// node_modules/ngx-quill/fesm2022/ngx-quill-config.mjs
var defaultModules = {
  toolbar: [
    ["bold", "italic", "underline", "strike"],
    // toggled buttons
    ["blockquote", "code-block"],
    [{
      header: 1
    }, {
      header: 2
    }],
    // custom button values
    [{
      list: "ordered"
    }, {
      list: "bullet"
    }],
    [{
      script: "sub"
    }, {
      script: "super"
    }],
    // superscript/subscript
    [{
      indent: "-1"
    }, {
      indent: "+1"
    }],
    // outdent/indent
    [{
      direction: "rtl"
    }],
    // text direction
    [{
      size: ["small", false, "large", "huge"]
    }],
    // custom dropdown
    [{
      header: [1, 2, 3, 4, 5, 6, false]
    }],
    [{
      color: []
    }, {
      background: []
    }],
    // dropdown with defaults from theme
    [{
      font: []
    }],
    [{
      align: []
    }],
    ["clean"],
    // remove formatting button
    ["link", "image", "video"],
    // link and image, video
    ["table"]
  ]
};
var QUILL_CONFIG_TOKEN = new InjectionToken("config", {
  providedIn: "root",
  factory: () => ({
    modules: defaultModules
  })
});
var _QuillConfigModule = class _QuillConfigModule {
  static forRoot(config) {
    return {
      ngModule: _QuillConfigModule,
      providers: [{
        provide: QUILL_CONFIG_TOKEN,
        useValue: config
      }]
    };
  }
};
_QuillConfigModule.ɵfac = function QuillConfigModule_Factory(__ngFactoryType__) {
  return new (__ngFactoryType__ || _QuillConfigModule)();
};
_QuillConfigModule.ɵmod = ɵɵdefineNgModule({
  type: _QuillConfigModule
});
_QuillConfigModule.ɵinj = ɵɵdefineInjector({});
var QuillConfigModule = _QuillConfigModule;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(QuillConfigModule, [{
    type: NgModule
  }], null, null);
})();
var provideQuillConfig = (config) => makeEnvironmentProviders([{
  provide: QUILL_CONFIG_TOKEN,
  useValue: config
}]);

// node_modules/@angular/core/fesm2022/rxjs-interop.mjs
function takeUntilDestroyed(destroyRef) {
  if (!destroyRef) {
    ngDevMode && assertInInjectionContext(takeUntilDestroyed);
    destroyRef = inject(DestroyRef);
  }
  const destroyed$ = new Observable((subscriber) => {
    if (destroyRef.destroyed) {
      subscriber.next();
      return;
    }
    const unregisterFn = destroyRef.onDestroy(subscriber.next.bind(subscriber));
    return unregisterFn;
  });
  return (source) => {
    return source.pipe(takeUntil(destroyed$));
  };
}

// node_modules/ngx-quill/fesm2022/ngx-quill.mjs
var _c0 = [[["", "above-quill-editor-toolbar", ""]], [["", "quill-editor-toolbar", ""]], [["", "below-quill-editor-toolbar", ""]]];
var _c1 = ["[above-quill-editor-toolbar]", "[quill-editor-toolbar]", "[below-quill-editor-toolbar]"];
function QuillEditorComponent_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵdomElement(0, "div", 0);
  }
}
function QuillEditorComponent_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵdomElement(0, "div", 0);
  }
}
var getFormat = (format, configFormat) => {
  const passedFormat = format || configFormat;
  return passedFormat || "html";
};
var _QuillService = class _QuillService {
  constructor() {
    this.config = inject(QUILL_CONFIG_TOKEN) || {
      modules: defaultModules
    };
    this.quill$ = defer(() => __async(this, null, function* () {
      if (!this.Quill) {
        const {
          Quill
        } = yield import("./ngx-quill-quill-CUw8Q_m0-J25QCBJP.js");
        this.Quill = Quill;
      }
      this.config.customOptions?.forEach((customOption) => {
        const newCustomOption = this.Quill.import(customOption.import);
        newCustomOption.whitelist = customOption.whitelist;
        this.Quill.register(newCustomOption, true, this.config.suppressGlobalRegisterWarning);
      });
      return new Promise((resolve) => {
        this.registerCustomModules(this.Quill, this.config.customModules, this.config.suppressGlobalRegisterWarning).subscribe(resolve);
      });
    })).pipe(shareReplay({
      bufferSize: 1,
      refCount: false
    }));
    this.registeredModules = /* @__PURE__ */ new Set();
  }
  getQuill() {
    return this.quill$;
  }
  /** @internal */
  beforeRender(Quill, customModules, beforeRender = this.config.beforeRender) {
    const sources = [this.registerCustomModules(Quill, customModules)];
    if (beforeRender) {
      sources.push(beforeRender());
    }
    return forkJoin(sources).pipe(map(() => Quill));
  }
  /** @internal */
  registerCustomModules(Quill, customModules, suppressGlobalRegisterWarning) {
    if (!Array.isArray(customModules)) {
      return of(Quill);
    }
    const sources = [];
    for (const customModule of customModules) {
      const {
        path,
        implementation: maybeImplementation
      } = customModule;
      if (this.registeredModules.has(path)) {
        continue;
      }
      this.registeredModules.add(path);
      if (isObservable(maybeImplementation)) {
        sources.push(maybeImplementation.pipe(tap((implementation) => {
          Quill.register(path, implementation, suppressGlobalRegisterWarning);
        })));
      } else {
        Quill.register(path, maybeImplementation, suppressGlobalRegisterWarning);
      }
    }
    return sources.length > 0 ? forkJoin(sources).pipe(map(() => Quill)) : of(Quill);
  }
};
_QuillService.ɵfac = function QuillService_Factory(__ngFactoryType__) {
  return new (__ngFactoryType__ || _QuillService)();
};
_QuillService.ɵprov = ɵɵdefineInjectable({
  token: _QuillService,
  factory: _QuillService.ɵfac,
  providedIn: "root"
});
var QuillService = _QuillService;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(QuillService, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], null, null);
})();
var _QuillEditorBase = class _QuillEditorBase {
  constructor() {
    this.format = input(...ngDevMode ? [void 0, {
      debugName: "format"
    }] : []);
    this.theme = input(...ngDevMode ? [void 0, {
      debugName: "theme"
    }] : []);
    this.modules = input(...ngDevMode ? [void 0, {
      debugName: "modules"
    }] : []);
    this.debug = input(false, ...ngDevMode ? [{
      debugName: "debug"
    }] : []);
    this.readOnly = input(false, ...ngDevMode ? [{
      debugName: "readOnly",
      transform: booleanAttribute
    }] : [{
      transform: booleanAttribute
    }]);
    this.placeholder = input(...ngDevMode ? [void 0, {
      debugName: "placeholder"
    }] : []);
    this.maxLength = input(...ngDevMode ? [void 0, {
      debugName: "maxLength"
    }] : []);
    this.minLength = input(...ngDevMode ? [void 0, {
      debugName: "minLength"
    }] : []);
    this.required = input(false, ...ngDevMode ? [{
      debugName: "required",
      transform: booleanAttribute
    }] : [{
      transform: booleanAttribute
    }]);
    this.formats = input(...ngDevMode ? [void 0, {
      debugName: "formats"
    }] : []);
    this.customToolbarPosition = input("top", ...ngDevMode ? [{
      debugName: "customToolbarPosition"
    }] : []);
    this.sanitize = input(...ngDevMode ? [void 0, {
      debugName: "sanitize"
    }] : []);
    this.beforeRender = input(...ngDevMode ? [void 0, {
      debugName: "beforeRender"
    }] : []);
    this.styles = input(null, ...ngDevMode ? [{
      debugName: "styles"
    }] : []);
    this.registry = input(...ngDevMode ? [void 0, {
      debugName: "registry"
    }] : []);
    this.bounds = input(...ngDevMode ? [void 0, {
      debugName: "bounds"
    }] : []);
    this.customOptions = input([], ...ngDevMode ? [{
      debugName: "customOptions"
    }] : []);
    this.customModules = input([], ...ngDevMode ? [{
      debugName: "customModules"
    }] : []);
    this.trackChanges = input(...ngDevMode ? [void 0, {
      debugName: "trackChanges"
    }] : []);
    this.classes = input(...ngDevMode ? [void 0, {
      debugName: "classes"
    }] : []);
    this.trimOnValidation = input(false, ...ngDevMode ? [{
      debugName: "trimOnValidation",
      transform: booleanAttribute
    }] : [{
      transform: booleanAttribute
    }]);
    this.linkPlaceholder = input(...ngDevMode ? [void 0, {
      debugName: "linkPlaceholder"
    }] : []);
    this.compareValues = input(false, ...ngDevMode ? [{
      debugName: "compareValues",
      transform: booleanAttribute
    }] : [{
      transform: booleanAttribute
    }]);
    this.filterNull = input(false, ...ngDevMode ? [{
      debugName: "filterNull",
      transform: booleanAttribute
    }] : [{
      transform: booleanAttribute
    }]);
    this.debounceTime = input(...ngDevMode ? [void 0, {
      debugName: "debounceTime"
    }] : []);
    this.onlyFormatEventData = input(false, ...ngDevMode ? [{
      debugName: "onlyFormatEventData"
    }] : []);
    this.defaultEmptyValue = input(null, ...ngDevMode ? [{
      debugName: "defaultEmptyValue"
    }] : []);
    this.onEditorCreated = new EventEmitter();
    this.onEditorChanged = new EventEmitter();
    this.onContentChanged = new EventEmitter();
    this.onSelectionChanged = new EventEmitter();
    this.onFocus = new EventEmitter();
    this.onBlur = new EventEmitter();
    this.onNativeFocus = new EventEmitter();
    this.onNativeBlur = new EventEmitter();
    this.disabled = false;
    this.toolbarPosition = signal("top", ...ngDevMode ? [{
      debugName: "toolbarPosition"
    }] : []);
    this.eventsSubscription = null;
    this.quillSubscription = null;
    this.elementRef = inject(ElementRef);
    this.domSanitizer = inject(DomSanitizer);
    this.platformId = inject(PLATFORM_ID);
    this.renderer = inject(Renderer2);
    this.service = inject(QuillService);
    this.destroyRef = inject(DestroyRef);
    this.init = false;
    this.valueGetter = input(this.getter.bind(this), ...ngDevMode ? [{
      debugName: "valueGetter"
    }] : []);
    this.valueSetter = input((quillEditor, value) => {
      const format = getFormat(this.format(), this.service.config.format);
      if (format === "html") {
        const sanitize = typeof this.sanitize() === "boolean" ? this.sanitize() : this.service.config.sanitize || false;
        if (sanitize) {
          value = this.domSanitizer.sanitize(SecurityContext.HTML, value);
        }
        return quillEditor.clipboard.convert({
          html: value
        });
      } else if (format === "json") {
        try {
          return JSON.parse(value);
        } catch {
          return [{
            insert: value
          }];
        }
      }
      return value;
    }, ...ngDevMode ? [{
      debugName: "valueSetter"
    }] : []);
    this.selectionChangeHandler = (range, oldRange, source) => {
      const trackChanges = this.trackChanges() || this.service.config.trackChanges;
      const shouldTriggerOnModelTouched = !range && !!this.onModelTouched && (source === "user" || trackChanges && trackChanges === "all");
      if (!this.onBlur.observed && !this.onFocus.observed && !this.onSelectionChanged.observed && !shouldTriggerOnModelTouched) {
        return;
      }
      if (range === null) {
        this.onBlur.emit({
          editor: this.quillEditor,
          source
        });
      } else if (oldRange === null) {
        this.onFocus.emit({
          editor: this.quillEditor,
          source
        });
      }
      this.onSelectionChanged.emit({
        editor: this.quillEditor,
        oldRange,
        range,
        source
      });
      if (shouldTriggerOnModelTouched) {
        this.onModelTouched();
      }
    };
    this.textChangeHandler = (delta, oldDelta, source) => {
      const trackChanges = this.trackChanges() || this.service.config.trackChanges;
      const shouldTriggerOnModelChange = (source === "user" || trackChanges && trackChanges === "all") && !!this.onModelChange;
      if (!this.onContentChanged.observed && !shouldTriggerOnModelChange) {
        return;
      }
      const data = this.eventCallbackFormats();
      if (shouldTriggerOnModelChange) {
        this.onModelChange(
          // only call value getter again if not already done in eventCallbackFormats
          data.noFormat ? this.valueGetter()(this.quillEditor) : data[data.format]
        );
      }
      this.onContentChanged.emit({
        content: data.object,
        delta,
        editor: this.quillEditor,
        html: data.html,
        oldDelta,
        source,
        text: data.text
      });
    };
    this.editorChangeHandler = (event, current, old, source) => {
      if (!this.onEditorChanged.observed) {
        return;
      }
      if (event === "text-change") {
        const data = this.eventCallbackFormats();
        this.onEditorChanged.emit({
          content: data.object,
          delta: current,
          editor: this.quillEditor,
          event,
          html: data.html,
          oldDelta: old,
          source,
          text: data.text
        });
      } else {
        this.onEditorChanged.emit({
          editor: this.quillEditor,
          event,
          oldRange: old,
          range: current,
          source
        });
      }
    };
    afterNextRender(() => {
      if (isPlatformServer(this.platformId)) {
        return;
      }
      this.quillSubscription = this.service.getQuill().pipe(mergeMap((Quill) => this.service.beforeRender(Quill, this.customModules(), this.beforeRender()))).subscribe((Quill) => {
        this.editorElem = this.elementRef.nativeElement.querySelector("[quill-editor-element]");
        const toolbarElem = this.elementRef.nativeElement.querySelector("[quill-editor-toolbar]");
        const modules = Object.assign({}, this.modules() || this.service.config.modules);
        if (toolbarElem) {
          modules.toolbar = toolbarElem;
        } else if (modules.toolbar === void 0) {
          modules.toolbar = defaultModules.toolbar;
        }
        let placeholder = this.placeholder() !== void 0 ? this.placeholder() : this.service.config.placeholder;
        if (placeholder === void 0) {
          placeholder = "Insert text here ...";
        }
        const styles = this.styles();
        if (styles) {
          this.previousStyles = styles;
          Object.keys(styles).forEach((key) => {
            this.renderer.setStyle(this.editorElem, key, styles[key]);
          });
        }
        const previousClasses = this.classes();
        if (previousClasses) {
          this.previousClasses = previousClasses;
          this.addClasses(previousClasses);
        }
        this.customOptions().forEach((customOption) => {
          const newCustomOption = Quill.import(customOption.import);
          newCustomOption.whitelist = customOption.whitelist;
          Quill.register(newCustomOption, true);
        });
        let bounds = this.bounds() && this.bounds() === "self" ? this.editorElem : this.bounds();
        if (!bounds) {
          bounds = this.service.config.bounds ? this.service.config.bounds : document.body;
        }
        let debug = this.debug();
        if (!debug && debug !== false && this.service.config.debug) {
          debug = this.service.config.debug;
        }
        let readOnly = this.readOnly();
        if (!readOnly && this.readOnly() !== false) {
          readOnly = this.service.config.readOnly !== void 0 ? this.service.config.readOnly : false;
        }
        let formats = this.formats();
        if (!formats && formats === void 0) {
          formats = this.service.config.formats ? [...this.service.config.formats] : this.service.config.formats === null ? null : void 0;
        }
        this.quillEditor = new Quill(this.editorElem, {
          bounds,
          debug,
          formats,
          modules,
          placeholder,
          readOnly,
          registry: this.registry(),
          theme: this.theme() || (this.service.config.theme ? this.service.config.theme : "snow")
        });
        if (this.onNativeBlur.observed) {
          fromEvent(this.quillEditor.scroll.domNode, "blur").pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.onNativeBlur.next({
            editor: this.quillEditor,
            source: "dom"
          }));
          const toolbar = this.quillEditor.getModule("toolbar");
          if (toolbar.container) {
            fromEvent(toolbar.container, "mousedown").pipe(takeUntilDestroyed(this.destroyRef)).subscribe((e) => e.preventDefault());
          }
        }
        if (this.onNativeFocus.observed) {
          fromEvent(this.quillEditor.scroll.domNode, "focus").pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.onNativeFocus.next({
            editor: this.quillEditor,
            source: "dom"
          }));
        }
        if (this.linkPlaceholder()) {
          const tooltip = this.quillEditor?.theme?.tooltip;
          const input2 = tooltip?.root?.querySelector("input[data-link]");
          if (input2?.dataset) {
            input2.dataset.link = this.linkPlaceholder();
          }
        }
        if (this.content) {
          const format = getFormat(this.format(), this.service.config.format);
          if (format === "text") {
            this.quillEditor.setText(this.content, "silent");
          } else {
            const valueSetter = this.valueSetter();
            const newValue = valueSetter(this.quillEditor, this.content);
            this.quillEditor.setContents(newValue, "silent");
          }
          const history = this.quillEditor.getModule("history");
          history.clear();
        }
        this.setDisabledState();
        this.addQuillEventListeners();
        if (!this.onEditorCreated.observed && !this.onValidatorChanged) {
          this.init = true;
          return;
        }
        if (this.onValidatorChanged) {
          this.onValidatorChanged();
        }
        this.onEditorCreated.emit(this.quillEditor);
        this.init = true;
      });
    });
    effect(() => {
      const customToolbarPosition = this.customToolbarPosition();
      if (this.init && this.toolbarPosition() !== customToolbarPosition) {
        this.toolbarPosition.set(customToolbarPosition);
      }
    });
    effect(() => {
      const readOnly = this.readOnly();
      if (this.init) {
        if (readOnly) {
          this.quillEditor?.disable();
        } else {
          this.quillEditor?.enable(true);
        }
      }
    });
    effect(() => {
      const placeholder = this.placeholder();
      if (this.init && this.quillEditor) {
        this.quillEditor.root.dataset.placeholder = placeholder;
      }
    });
    effect(() => {
      const styles = this.styles();
      if (!this.init || !this.editorElem) {
        return;
      }
      const currentStyling = styles;
      const previousStyling = this.previousStyles;
      if (previousStyling) {
        Object.keys(previousStyling).forEach((key) => {
          this.renderer.removeStyle(this.editorElem, key);
        });
      }
      if (currentStyling) {
        Object.keys(currentStyling).forEach((key) => {
          this.renderer.setStyle(this.editorElem, key, currentStyling[key]);
        });
      }
    });
    effect(() => {
      const classes = this.classes();
      if (!this.init || !this.quillEditor) {
        return;
      }
      const currentClasses = classes;
      const previousClasses = this.previousClasses;
      if (previousClasses) {
        this.removeClasses(previousClasses);
      }
      if (currentClasses) {
        this.addClasses(currentClasses);
      }
    });
    effect(() => {
      const debounceTime2 = this.debounceTime();
      if (!this.init || !this.quillEditor) {
        return;
      }
      if (debounceTime2) {
        this.addQuillEventListeners();
      }
    });
    this.destroyRef.onDestroy(() => {
      this.dispose();
      this.quillSubscription?.unsubscribe();
      this.quillSubscription = null;
    });
  }
  static normalizeClassNames(classes) {
    const classList = classes.trim().split(" ");
    return classList.reduce((prev, cur) => {
      const trimmed = cur.trim();
      if (trimmed) {
        prev.push(trimmed);
      }
      return prev;
    }, []);
  }
  addClasses(classList) {
    _QuillEditorBase.normalizeClassNames(classList).forEach((c) => {
      this.renderer.addClass(this.editorElem, c);
    });
  }
  removeClasses(classList) {
    _QuillEditorBase.normalizeClassNames(classList).forEach((c) => {
      this.renderer.removeClass(this.editorElem, c);
    });
  }
  writeValue(currentValue) {
    if (this.filterNull() && currentValue === null) {
      return;
    }
    this.content = currentValue;
    if (!this.quillEditor) {
      return;
    }
    const format = getFormat(this.format(), this.service.config.format);
    const valueSetter = this.valueSetter();
    const newValue = valueSetter(this.quillEditor, currentValue);
    if (this.compareValues()) {
      const currentEditorValue = this.quillEditor.getContents();
      if (JSON.stringify(currentEditorValue) === JSON.stringify(newValue)) {
        return;
      }
    }
    if (currentValue) {
      if (format === "text") {
        this.quillEditor.setText(currentValue);
      } else {
        this.quillEditor.setContents(newValue);
      }
      return;
    }
    this.quillEditor.setText("");
  }
  setDisabledState(isDisabled = this.disabled) {
    this.disabled = isDisabled;
    if (this.quillEditor) {
      if (isDisabled) {
        this.quillEditor.disable();
        this.renderer.setAttribute(this.elementRef.nativeElement, "disabled", "disabled");
      } else {
        if (!this.readOnly()) {
          this.quillEditor.enable();
        }
        this.renderer.removeAttribute(this.elementRef.nativeElement, "disabled");
      }
    }
  }
  registerOnChange(fn) {
    this.onModelChange = fn;
  }
  registerOnTouched(fn) {
    this.onModelTouched = fn;
  }
  registerOnValidatorChange(fn) {
    this.onValidatorChanged = fn;
  }
  validate() {
    if (!this.quillEditor) {
      return null;
    }
    const err = {};
    let valid = true;
    const text = this.quillEditor.getText();
    const textLength = this.trimOnValidation() ? text.trim().length : text.length === 1 && text.trim().length === 0 ? 0 : text.length - 1;
    const deltaOperations = this.quillEditor.getContents().ops;
    const onlyEmptyOperation = !!deltaOperations && deltaOperations.length === 1 && ["\n", ""].includes(deltaOperations[0].insert?.toString() || "");
    const minLength = this.minLength();
    if (minLength && textLength && textLength < minLength) {
      err.minLengthError = {
        given: textLength,
        minLength
      };
      valid = false;
    }
    const maxLength = this.maxLength();
    if (maxLength && textLength > maxLength) {
      err.maxLengthError = {
        given: textLength,
        maxLength
      };
      valid = false;
    }
    if (this.required() && !textLength && onlyEmptyOperation) {
      err.requiredError = {
        empty: true
      };
      valid = false;
    }
    return valid ? null : err;
  }
  addQuillEventListeners() {
    this.dispose();
    this.eventsSubscription = new Subscription();
    this.eventsSubscription.add(
      // mark model as touched if editor lost focus
      fromEvent(this.quillEditor, "selection-change").subscribe(([range, oldRange, source]) => {
        this.selectionChangeHandler(range, oldRange, source);
      })
    );
    let textChange$ = fromEvent(this.quillEditor, "text-change");
    let editorChange$ = fromEvent(this.quillEditor, "editor-change");
    const _debounceTime = this.debounceTime();
    if (typeof _debounceTime === "number") {
      textChange$ = textChange$.pipe(debounceTime(_debounceTime));
      editorChange$ = editorChange$.pipe(debounceTime(_debounceTime));
    }
    this.eventsSubscription.add(
      // update model if text changes
      textChange$.subscribe(([delta, oldDelta, source]) => {
        this.textChangeHandler(delta, oldDelta, source);
      })
    );
    this.eventsSubscription.add(
      // triggered if selection or text changed
      editorChange$.subscribe(([event, current, old, source]) => {
        this.editorChangeHandler(event, current, old, source);
      })
    );
  }
  dispose() {
    this.eventsSubscription?.unsubscribe();
    this.eventsSubscription = null;
  }
  isEmptyValue(html) {
    return html === "<p></p>" || html === "<div></div>" || html === "<p><br></p>" || html === "<div><br></div>";
  }
  getter(quillEditor, forceFormat) {
    let modelValue = null;
    const format = forceFormat ?? getFormat(this.format(), this.service.config.format);
    if (format === "html") {
      let html = quillEditor.getSemanticHTML();
      if (this.isEmptyValue(html)) {
        html = this.defaultEmptyValue();
      }
      modelValue = html;
    } else if (format === "text") {
      modelValue = quillEditor.getText();
    } else if (format === "object") {
      modelValue = quillEditor.getContents();
    } else if (format === "json") {
      try {
        modelValue = JSON.stringify(quillEditor.getContents());
      } catch {
        modelValue = quillEditor.getText();
      }
    }
    return modelValue;
  }
  eventCallbackFormats() {
    const format = getFormat(this.format(), this.service.config.format);
    const onlyFormat = this.onlyFormatEventData() === true;
    const noFormat = this.onlyFormatEventData() === "none";
    let text = null;
    let html = null;
    let object = null;
    let json = null;
    if (noFormat) {
      return {
        format,
        onlyFormat,
        noFormat,
        text,
        object,
        json,
        html
      };
    }
    const value = this.valueGetter()(this.quillEditor);
    if (format === "text") {
      text = value;
    } else if (format === "html") {
      html = value;
    } else if (format === "object") {
      object = value;
      json = JSON.stringify(value);
    } else if (format === "json") {
      json = value;
      object = JSON.parse(value);
    }
    if (onlyFormat) {
      return {
        format,
        onlyFormat,
        noFormat,
        text,
        json,
        html,
        object
      };
    }
    return {
      format,
      onlyFormat,
      noFormat,
      // use internal getter to retrieve correct other values - this.valueGetter can be overwritten
      text: format === "text" ? text : this.getter(this.quillEditor, "text"),
      json: format === "json" ? json : this.getter(this.quillEditor, "json"),
      html: format === "html" ? html : this.getter(this.quillEditor, "html"),
      object: format === "object" ? object : this.getter(this.quillEditor, "object")
    };
  }
};
_QuillEditorBase.ɵfac = function QuillEditorBase_Factory(__ngFactoryType__) {
  return new (__ngFactoryType__ || _QuillEditorBase)();
};
_QuillEditorBase.ɵdir = ɵɵdefineDirective({
  type: _QuillEditorBase,
  inputs: {
    format: [1, "format"],
    theme: [1, "theme"],
    modules: [1, "modules"],
    debug: [1, "debug"],
    readOnly: [1, "readOnly"],
    placeholder: [1, "placeholder"],
    maxLength: [1, "maxLength"],
    minLength: [1, "minLength"],
    required: [1, "required"],
    formats: [1, "formats"],
    customToolbarPosition: [1, "customToolbarPosition"],
    sanitize: [1, "sanitize"],
    beforeRender: [1, "beforeRender"],
    styles: [1, "styles"],
    registry: [1, "registry"],
    bounds: [1, "bounds"],
    customOptions: [1, "customOptions"],
    customModules: [1, "customModules"],
    trackChanges: [1, "trackChanges"],
    classes: [1, "classes"],
    trimOnValidation: [1, "trimOnValidation"],
    linkPlaceholder: [1, "linkPlaceholder"],
    compareValues: [1, "compareValues"],
    filterNull: [1, "filterNull"],
    debounceTime: [1, "debounceTime"],
    onlyFormatEventData: [1, "onlyFormatEventData"],
    defaultEmptyValue: [1, "defaultEmptyValue"],
    valueGetter: [1, "valueGetter"],
    valueSetter: [1, "valueSetter"]
  },
  outputs: {
    onEditorCreated: "onEditorCreated",
    onEditorChanged: "onEditorChanged",
    onContentChanged: "onContentChanged",
    onSelectionChanged: "onSelectionChanged",
    onFocus: "onFocus",
    onBlur: "onBlur",
    onNativeFocus: "onNativeFocus",
    onNativeBlur: "onNativeBlur"
  }
});
var QuillEditorBase = _QuillEditorBase;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(QuillEditorBase, [{
    type: Directive
  }], () => [], {
    format: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "format",
        required: false
      }]
    }],
    theme: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "theme",
        required: false
      }]
    }],
    modules: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "modules",
        required: false
      }]
    }],
    debug: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "debug",
        required: false
      }]
    }],
    readOnly: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "readOnly",
        required: false
      }]
    }],
    placeholder: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "placeholder",
        required: false
      }]
    }],
    maxLength: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "maxLength",
        required: false
      }]
    }],
    minLength: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "minLength",
        required: false
      }]
    }],
    required: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "required",
        required: false
      }]
    }],
    formats: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "formats",
        required: false
      }]
    }],
    customToolbarPosition: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "customToolbarPosition",
        required: false
      }]
    }],
    sanitize: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "sanitize",
        required: false
      }]
    }],
    beforeRender: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "beforeRender",
        required: false
      }]
    }],
    styles: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "styles",
        required: false
      }]
    }],
    registry: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "registry",
        required: false
      }]
    }],
    bounds: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "bounds",
        required: false
      }]
    }],
    customOptions: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "customOptions",
        required: false
      }]
    }],
    customModules: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "customModules",
        required: false
      }]
    }],
    trackChanges: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "trackChanges",
        required: false
      }]
    }],
    classes: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "classes",
        required: false
      }]
    }],
    trimOnValidation: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "trimOnValidation",
        required: false
      }]
    }],
    linkPlaceholder: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "linkPlaceholder",
        required: false
      }]
    }],
    compareValues: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "compareValues",
        required: false
      }]
    }],
    filterNull: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "filterNull",
        required: false
      }]
    }],
    debounceTime: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "debounceTime",
        required: false
      }]
    }],
    onlyFormatEventData: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "onlyFormatEventData",
        required: false
      }]
    }],
    defaultEmptyValue: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "defaultEmptyValue",
        required: false
      }]
    }],
    onEditorCreated: [{
      type: Output
    }],
    onEditorChanged: [{
      type: Output
    }],
    onContentChanged: [{
      type: Output
    }],
    onSelectionChanged: [{
      type: Output
    }],
    onFocus: [{
      type: Output
    }],
    onBlur: [{
      type: Output
    }],
    onNativeFocus: [{
      type: Output
    }],
    onNativeBlur: [{
      type: Output
    }],
    valueGetter: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "valueGetter",
        required: false
      }]
    }],
    valueSetter: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "valueSetter",
        required: false
      }]
    }]
  });
})();
var _QuillEditorComponent = class _QuillEditorComponent extends QuillEditorBase {
};
_QuillEditorComponent.ɵfac = /* @__PURE__ */ (() => {
  let ɵQuillEditorComponent_BaseFactory;
  return function QuillEditorComponent_Factory(__ngFactoryType__) {
    return (ɵQuillEditorComponent_BaseFactory || (ɵQuillEditorComponent_BaseFactory = ɵɵgetInheritedFactory(_QuillEditorComponent)))(__ngFactoryType__ || _QuillEditorComponent);
  };
})();
_QuillEditorComponent.ɵcmp = ɵɵdefineComponent({
  type: _QuillEditorComponent,
  selectors: [["quill-editor"]],
  features: [ɵɵProvidersFeature([{
    multi: true,
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => _QuillEditorComponent)
  }, {
    multi: true,
    provide: NG_VALIDATORS,
    useExisting: forwardRef(() => _QuillEditorComponent)
  }]), ɵɵInheritDefinitionFeature],
  ngContentSelectors: _c1,
  decls: 5,
  vars: 2,
  consts: [["quill-editor-element", ""]],
  template: function QuillEditorComponent_Template(rf, ctx) {
    if (rf & 1) {
      ɵɵprojectionDef(_c0);
      ɵɵconditionalCreate(0, QuillEditorComponent_Conditional_0_Template, 1, 0, "div", 0);
      ɵɵprojection(1);
      ɵɵprojection(2, 1);
      ɵɵprojection(3, 2);
      ɵɵconditionalCreate(4, QuillEditorComponent_Conditional_4_Template, 1, 0, "div", 0);
    }
    if (rf & 2) {
      ɵɵconditional(ctx.toolbarPosition() !== "top" ? 0 : -1);
      ɵɵadvance(4);
      ɵɵconditional(ctx.toolbarPosition() === "top" ? 4 : -1);
    }
  },
  styles: ["[_nghost-%COMP%]{display:inline-block}"],
  changeDetection: 0
});
var QuillEditorComponent = _QuillEditorComponent;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(QuillEditorComponent, [{
    type: Component,
    args: [{
      encapsulation: ViewEncapsulation.Emulated,
      providers: [{
        multi: true,
        provide: NG_VALUE_ACCESSOR,
        useExisting: forwardRef(() => QuillEditorComponent)
      }, {
        multi: true,
        provide: NG_VALIDATORS,
        useExisting: forwardRef(() => QuillEditorComponent)
      }],
      changeDetection: ChangeDetectionStrategy.OnPush,
      selector: "quill-editor",
      template: `
    @if (toolbarPosition() !== 'top') {
        <div quill-editor-element></div>
    }

    <ng-content select="[above-quill-editor-toolbar]"></ng-content>
    <ng-content select="[quill-editor-toolbar]"></ng-content>
    <ng-content select="[below-quill-editor-toolbar]"></ng-content>

    @if (toolbarPosition() === 'top') {
        <div quill-editor-element></div>
    }
  `,
      styles: [":host{display:inline-block}\n"]
    }]
  }], null, null);
})();
var _QuillViewHTMLComponent = class _QuillViewHTMLComponent {
  constructor() {
    this.content = input("", ...ngDevMode ? [{
      debugName: "content"
    }] : []);
    this.theme = input(...ngDevMode ? [void 0, {
      debugName: "theme"
    }] : []);
    this.sanitize = input(...ngDevMode ? [void 0, {
      debugName: "sanitize"
    }] : []);
    this.innerHTML = computed(() => {
      const sanitize = this.sanitize();
      const content = this.content();
      return (typeof sanitize === "boolean" ? sanitize : this.service.config.sanitize || false) ? content : this.sanitizer.bypassSecurityTrustHtml(content);
    }, ...ngDevMode ? [{
      debugName: "innerHTML"
    }] : []);
    this.themeClass = computed(() => {
      const base = this.service.config.theme ? this.service.config.theme : "snow";
      return `ql-${this.theme() || base} ngx-quill-view-html`;
    }, ...ngDevMode ? [{
      debugName: "themeClass"
    }] : []);
    this.sanitizer = inject(DomSanitizer);
    this.service = inject(QuillService);
  }
};
_QuillViewHTMLComponent.ɵfac = function QuillViewHTMLComponent_Factory(__ngFactoryType__) {
  return new (__ngFactoryType__ || _QuillViewHTMLComponent)();
};
_QuillViewHTMLComponent.ɵcmp = ɵɵdefineComponent({
  type: _QuillViewHTMLComponent,
  selectors: [["quill-view-html"]],
  inputs: {
    content: [1, "content"],
    theme: [1, "theme"],
    sanitize: [1, "sanitize"]
  },
  decls: 2,
  vars: 3,
  consts: [[1, "ql-container"], [1, "ql-editor", 3, "innerHTML"]],
  template: function QuillViewHTMLComponent_Template(rf, ctx) {
    if (rf & 1) {
      ɵɵdomElementStart(0, "div", 0);
      ɵɵdomElement(1, "div", 1);
      ɵɵdomElementEnd();
    }
    if (rf & 2) {
      ɵɵclassMap(ctx.themeClass());
      ɵɵadvance();
      ɵɵdomProperty("innerHTML", ctx.innerHTML(), ɵɵsanitizeHtml);
    }
  },
  styles: [".ql-container.ngx-quill-view-html{border:0}\n"],
  encapsulation: 2,
  changeDetection: 0
});
var QuillViewHTMLComponent = _QuillViewHTMLComponent;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(QuillViewHTMLComponent, [{
    type: Component,
    args: [{
      changeDetection: ChangeDetectionStrategy.OnPush,
      encapsulation: ViewEncapsulation.None,
      selector: "quill-view-html",
      template: `
  <div class="ql-container" [class]="themeClass()">
    <div class="ql-editor" [innerHTML]="innerHTML()">
    </div>
  </div>
`,
      styles: [".ql-container.ngx-quill-view-html{border:0}\n"]
    }]
  }], null, {
    content: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "content",
        required: false
      }]
    }],
    theme: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "theme",
        required: false
      }]
    }],
    sanitize: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "sanitize",
        required: false
      }]
    }]
  });
})();
var _QuillViewComponent = class _QuillViewComponent {
  constructor() {
    this.format = input(...ngDevMode ? [void 0, {
      debugName: "format"
    }] : []);
    this.theme = input(...ngDevMode ? [void 0, {
      debugName: "theme"
    }] : []);
    this.modules = input(...ngDevMode ? [void 0, {
      debugName: "modules"
    }] : []);
    this.debug = input(false, ...ngDevMode ? [{
      debugName: "debug"
    }] : []);
    this.formats = input(...ngDevMode ? [void 0, {
      debugName: "formats"
    }] : []);
    this.sanitize = input(...ngDevMode ? [void 0, {
      debugName: "sanitize"
    }] : []);
    this.beforeRender = input(...ngDevMode ? [void 0, {
      debugName: "beforeRender"
    }] : []);
    this.strict = input(true, ...ngDevMode ? [{
      debugName: "strict"
    }] : []);
    this.content = input(...ngDevMode ? [void 0, {
      debugName: "content"
    }] : []);
    this.customModules = input([], ...ngDevMode ? [{
      debugName: "customModules"
    }] : []);
    this.customOptions = input([], ...ngDevMode ? [{
      debugName: "customOptions"
    }] : []);
    this.onEditorCreated = new EventEmitter();
    this.init = false;
    this.elementRef = inject(ElementRef);
    this.renderer = inject(Renderer2);
    this.service = inject(QuillService);
    this.sanitizer = inject(DomSanitizer);
    this.platformId = inject(PLATFORM_ID);
    this.destroyRef = inject(DestroyRef);
    this.valueSetter = (quillEditor, value) => {
      const format = getFormat(this.format(), this.service.config.format);
      let content = value;
      if (format === "text") {
        quillEditor.setText(content);
      } else {
        if (format === "html") {
          const sanitize = typeof this.sanitize() === "boolean" ? this.sanitize() : this.service.config.sanitize || false;
          if (sanitize) {
            value = this.sanitizer.sanitize(SecurityContext.HTML, value);
          }
          content = quillEditor.clipboard.convert({
            html: value
          });
        } else if (format === "json") {
          try {
            content = JSON.parse(value);
          } catch {
            content = [{
              insert: value
            }];
          }
        }
        quillEditor.setContents(content);
      }
    };
    afterNextRender(() => {
      if (isPlatformServer(this.platformId)) {
        return;
      }
      const quillSubscription = this.service.getQuill().pipe(mergeMap((Quill) => this.service.beforeRender(Quill, this.customModules(), this.beforeRender()))).subscribe((Quill) => {
        const modules = Object.assign({}, this.modules() || this.service.config.modules);
        modules.toolbar = false;
        this.customOptions().forEach((customOption) => {
          const newCustomOption = Quill.import(customOption.import);
          newCustomOption.whitelist = customOption.whitelist;
          Quill.register(newCustomOption, true);
        });
        let debug = this.debug();
        if (!debug && debug !== false && this.service.config.debug) {
          debug = this.service.config.debug;
        }
        let formats = this.formats();
        if (formats === void 0) {
          formats = this.service.config.formats ? [...this.service.config.formats] : this.service.config.formats === null ? null : void 0;
        }
        const theme = this.theme() || (this.service.config.theme ? this.service.config.theme : "snow");
        this.editorElem = this.elementRef.nativeElement.querySelector("[quill-view-element]");
        this.quillEditor = new Quill(this.editorElem, {
          debug,
          formats,
          modules,
          readOnly: true,
          strict: this.strict(),
          theme
        });
        this.renderer.addClass(this.editorElem, "ngx-quill-view");
        if (this.content()) {
          this.valueSetter(this.quillEditor, this.content());
        }
        if (!this.onEditorCreated.observed) {
          this.init = true;
          return;
        }
        this.onEditorCreated.emit(this.quillEditor);
        this.init = true;
      });
      this.destroyRef.onDestroy(() => quillSubscription.unsubscribe());
    });
    effect(() => {
      const content = this.content();
      if (!this.quillEditor || !this.init) {
        return;
      }
      if (content) {
        this.valueSetter(this.quillEditor, content);
      }
    });
  }
};
_QuillViewComponent.ɵfac = function QuillViewComponent_Factory(__ngFactoryType__) {
  return new (__ngFactoryType__ || _QuillViewComponent)();
};
_QuillViewComponent.ɵcmp = ɵɵdefineComponent({
  type: _QuillViewComponent,
  selectors: [["quill-view"]],
  inputs: {
    format: [1, "format"],
    theme: [1, "theme"],
    modules: [1, "modules"],
    debug: [1, "debug"],
    formats: [1, "formats"],
    sanitize: [1, "sanitize"],
    beforeRender: [1, "beforeRender"],
    strict: [1, "strict"],
    content: [1, "content"],
    customModules: [1, "customModules"],
    customOptions: [1, "customOptions"]
  },
  outputs: {
    onEditorCreated: "onEditorCreated"
  },
  decls: 1,
  vars: 0,
  consts: [["quill-view-element", ""]],
  template: function QuillViewComponent_Template(rf, ctx) {
    if (rf & 1) {
      ɵɵdomElement(0, "div", 0);
    }
  },
  styles: [".ql-container.ngx-quill-view{border:0}\n"],
  encapsulation: 2,
  changeDetection: 0
});
var QuillViewComponent = _QuillViewComponent;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(QuillViewComponent, [{
    type: Component,
    args: [{
      changeDetection: ChangeDetectionStrategy.OnPush,
      encapsulation: ViewEncapsulation.None,
      selector: "quill-view",
      template: `
  <div quill-view-element></div>
`,
      styles: [".ql-container.ngx-quill-view{border:0}\n"]
    }]
  }], () => [], {
    format: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "format",
        required: false
      }]
    }],
    theme: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "theme",
        required: false
      }]
    }],
    modules: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "modules",
        required: false
      }]
    }],
    debug: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "debug",
        required: false
      }]
    }],
    formats: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "formats",
        required: false
      }]
    }],
    sanitize: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "sanitize",
        required: false
      }]
    }],
    beforeRender: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "beforeRender",
        required: false
      }]
    }],
    strict: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "strict",
        required: false
      }]
    }],
    content: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "content",
        required: false
      }]
    }],
    customModules: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "customModules",
        required: false
      }]
    }],
    customOptions: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "customOptions",
        required: false
      }]
    }],
    onEditorCreated: [{
      type: Output
    }]
  });
})();
var _QuillModule = class _QuillModule {
  static forRoot(config) {
    return {
      ngModule: _QuillModule,
      providers: [{
        provide: QUILL_CONFIG_TOKEN,
        useValue: config
      }]
    };
  }
};
_QuillModule.ɵfac = function QuillModule_Factory(__ngFactoryType__) {
  return new (__ngFactoryType__ || _QuillModule)();
};
_QuillModule.ɵmod = ɵɵdefineNgModule({
  type: _QuillModule,
  imports: [QuillEditorComponent, QuillViewComponent, QuillViewHTMLComponent],
  exports: [QuillEditorComponent, QuillViewComponent, QuillViewHTMLComponent]
});
_QuillModule.ɵinj = ɵɵdefineInjector({});
var QuillModule = _QuillModule;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(QuillModule, [{
    type: NgModule,
    args: [{
      imports: [QuillEditorComponent, QuillViewComponent, QuillViewHTMLComponent],
      exports: [QuillEditorComponent, QuillViewComponent, QuillViewHTMLComponent]
    }]
  }], null, null);
})();
export {
  QUILL_CONFIG_TOKEN,
  QuillConfigModule,
  QuillEditorBase,
  QuillEditorComponent,
  QuillModule,
  QuillService,
  QuillViewComponent,
  QuillViewHTMLComponent,
  defaultModules,
  provideQuillConfig
};
//# sourceMappingURL=ngx-quill.js.map
