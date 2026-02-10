import {
  HttpBackend,
  HttpHeaders,
  HttpParams,
  HttpRequest,
  HttpResponse
} from "./chunk-NDRROL2V.js";
import {
  CommonModule,
  DatePipe,
  isPlatformBrowser
} from "./chunk-UMP6WTLP.js";
import "./chunk-IOPAUTAH.js";
import {
  Inject,
  Injectable,
  NgModule,
  NgZone,
  Optional,
  PLATFORM_ID,
  setClassMetadata,
  ɵɵdefineInjectable,
  ɵɵdefineInjector,
  ɵɵdefineNgModule,
  ɵɵinject
} from "./chunk-PAZLCQOI.js";
import "./chunk-P3SL7YBB.js";
import {
  isObservable
} from "./chunk-FFDLTZ5V.js";
import {
  BehaviorSubject,
  catchError,
  concatMap,
  filter,
  map,
  of,
  retry,
  shareReplay,
  take,
  throwError,
  timer
} from "./chunk-LXGHM4HW.js";
import "./chunk-XBB75M5E.js";
import {
  __spreadValues
} from "./chunk-QXFS4N4X.js";

// node_modules/vlq/dist/vlq.es.js
var charToInteger = {};
var integerToChar = {};
"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".split("").forEach(function(char, i) {
  charToInteger[char] = i;
  integerToChar[i] = char;
});
function decode(string) {
  var result = [];
  var shift = 0;
  var value = 0;
  for (var i = 0; i < string.length; i += 1) {
    var integer = charToInteger[string[i]];
    if (integer === void 0) {
      throw new Error("Invalid character (" + string[i] + ")");
    }
    var hasContinuationBit = integer & 32;
    integer &= 31;
    value += integer << shift;
    if (hasContinuationBit) {
      shift += 5;
    } else {
      var shouldNegate = value & 1;
      value >>>= 1;
      if (shouldNegate) {
        result.push(value === 0 ? -2147483648 : -value);
      } else {
        result.push(value);
      }
      value = shift = 0;
    }
  }
  return result;
}

// node_modules/ngx-logger/fesm2020/ngx-logger.mjs
var TOKEN_LOGGER_CONFIG = "TOKEN_LOGGER_CONFIG";
var NGXLoggerConfigEngine = class {
  constructor(config) {
    this.config = this._clone(config);
  }
  /** Get a readonly access to the level configured for the NGXLogger */
  get level() {
    return this.config.level;
  }
  /** Get a readonly access to the serverLogLevel configured for the NGXLogger */
  get serverLogLevel() {
    return this.config.serverLogLevel;
  }
  updateConfig(config) {
    this.config = this._clone(config);
  }
  /** Update the config partially
   * This is useful if you want to update only one parameter of the config
   */
  partialUpdateConfig(partialConfig) {
    if (!partialConfig) {
      return;
    }
    Object.keys(partialConfig).forEach((configParamKey) => {
      this.config[configParamKey] = partialConfig[configParamKey];
    });
  }
  getConfig() {
    return this._clone(this.config);
  }
  // TODO: This is a shallow clone, If the config ever becomes hierarchical we must make this a deep clone
  _clone(object) {
    const cloneConfig = {
      level: null
    };
    Object.keys(object).forEach((key) => {
      cloneConfig[key] = object[key];
    });
    return cloneConfig;
  }
};
var TOKEN_LOGGER_CONFIG_ENGINE_FACTORY = "TOKEN_LOGGER_CONFIG_ENGINE_FACTORY";
var NGXLoggerConfigEngineFactory = class {
  provideConfigEngine(config) {
    return new NGXLoggerConfigEngine(config);
  }
};
var TOKEN_LOGGER_MAPPER_SERVICE = "TOKEN_LOGGER_MAPPER_SERVICE";
var NGXLoggerMapperService = class {
  constructor(httpBackend) {
    this.httpBackend = httpBackend;
    this.sourceMapCache = /* @__PURE__ */ new Map();
    this.logPositionCache = /* @__PURE__ */ new Map();
  }
  /**
   * Returns the log position of the caller
   * If sourceMaps are enabled, it attemps to get the source map from the server, and use that to parse the position
   * @param config
   * @param metadata
   * @returns
   */
  getLogPosition(config, metadata) {
    const stackLine = this.getStackLine(config);
    if (!stackLine) {
      return of({
        fileName: "",
        lineNumber: 0,
        columnNumber: 0
      });
    }
    const logPosition = this.getLocalPosition(stackLine);
    if (!config.enableSourceMaps) {
      return of(logPosition);
    }
    const sourceMapLocation = this.getSourceMapLocation(stackLine);
    return this.getSourceMap(sourceMapLocation, logPosition);
  }
  /**
   * Get the stackline of the original caller
   * @param config
   * @returns null if stackline was not found
   */
  getStackLine(config) {
    const error = new Error();
    try {
      throw error;
    } catch (e) {
      try {
        let defaultProxy = 4;
        const firstStackLine = error.stack.split("\n")[0];
        if (!firstStackLine.includes(".js:")) {
          defaultProxy = defaultProxy + 1;
        }
        return error.stack.split("\n")[defaultProxy + (config.proxiedSteps || 0)];
      } catch (e2) {
        return null;
      }
    }
  }
  /**
   * Get position of caller without using sourceMaps
   * @param stackLine
   * @returns
   */
  getLocalPosition(stackLine) {
    const positionStartIndex = stackLine.lastIndexOf("/");
    let positionEndIndex = stackLine.indexOf(")");
    if (positionEndIndex < 0) {
      positionEndIndex = void 0;
    }
    const position = stackLine.substring(positionStartIndex + 1, positionEndIndex);
    const dataArray = position.split(":");
    if (dataArray.length === 3) {
      return {
        fileName: dataArray[0],
        lineNumber: +dataArray[1],
        columnNumber: +dataArray[2]
      };
    }
    return {
      fileName: "unknown",
      lineNumber: 0,
      columnNumber: 0
    };
  }
  getTranspileLocation(stackLine) {
    let locationStartIndex = stackLine.indexOf("(");
    if (locationStartIndex < 0) {
      locationStartIndex = stackLine.lastIndexOf("@");
      if (locationStartIndex < 0) {
        locationStartIndex = stackLine.lastIndexOf(" ");
      }
    }
    let locationEndIndex = stackLine.indexOf(")");
    if (locationEndIndex < 0) {
      locationEndIndex = void 0;
    }
    return stackLine.substring(locationStartIndex + 1, locationEndIndex);
  }
  /**
   * Gets the URL of the sourcemap (the URL can be relative or absolute, it is browser dependant)
   * @param stackLine
   * @returns
   */
  getSourceMapLocation(stackLine) {
    const file = this.getTranspileLocation(stackLine);
    const mapFullPath = file.substring(0, file.lastIndexOf(":"));
    return mapFullPath.substring(0, mapFullPath.lastIndexOf(":")) + ".map";
  }
  getMapping(sourceMap, position) {
    let sourceFileIndex = 0, sourceCodeLine = 0, sourceCodeColumn = 0;
    const lines = sourceMap.mappings.split(";");
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      let generatedCodeColumn = 0;
      const columns = lines[lineIndex].split(",");
      for (let columnIndex = 0; columnIndex < columns.length; columnIndex++) {
        const decodedSection = decode(columns[columnIndex]);
        if (decodedSection.length >= 4) {
          generatedCodeColumn += decodedSection[0];
          sourceFileIndex += decodedSection[1];
          sourceCodeLine += decodedSection[2];
          sourceCodeColumn += decodedSection[3];
        }
        if (lineIndex === position.lineNumber) {
          if (generatedCodeColumn === position.columnNumber) {
            return {
              fileName: sourceMap.sources[sourceFileIndex],
              lineNumber: sourceCodeLine,
              columnNumber: sourceCodeColumn
            };
          } else if (columnIndex + 1 === columns.length) {
            return {
              fileName: sourceMap.sources[sourceFileIndex],
              lineNumber: sourceCodeLine,
              columnNumber: 0
            };
          }
        }
      }
    }
    return {
      fileName: "unknown",
      lineNumber: 0,
      columnNumber: 0
    };
  }
  /**
   * does the http get request to get the source map
   * @param sourceMapLocation
   * @param distPosition
   */
  getSourceMap(sourceMapLocation, distPosition) {
    const req = new HttpRequest("GET", sourceMapLocation);
    const distPositionKey = `${distPosition.fileName}:${distPosition.lineNumber}:${distPosition.columnNumber}`;
    if (this.logPositionCache.has(distPositionKey)) {
      return this.logPositionCache.get(distPositionKey);
    }
    if (!this.sourceMapCache.has(sourceMapLocation)) {
      if (!this.httpBackend) {
        console.error("NGXLogger : Can't get sourcemap because HttpBackend is not provided. You need to import HttpClientModule");
        this.sourceMapCache.set(sourceMapLocation, of(null));
      } else {
        this.sourceMapCache.set(sourceMapLocation, this.httpBackend.handle(req).pipe(filter((e) => e instanceof HttpResponse), map((httpResponse) => httpResponse.body), retry(3), shareReplay(1)));
      }
    }
    const logPosition$ = this.sourceMapCache.get(sourceMapLocation).pipe(map((sourceMap) => {
      if (!sourceMap) {
        return distPosition;
      }
      return this.getMapping(sourceMap, distPosition);
    }), catchError(() => of(distPosition)), shareReplay(1));
    this.logPositionCache.set(distPositionKey, logPosition$);
    return logPosition$;
  }
};
NGXLoggerMapperService.ɵfac = function NGXLoggerMapperService_Factory(__ngFactoryType__) {
  return new (__ngFactoryType__ || NGXLoggerMapperService)(ɵɵinject(HttpBackend, 8));
};
NGXLoggerMapperService.ɵprov = ɵɵdefineInjectable({
  token: NGXLoggerMapperService,
  factory: NGXLoggerMapperService.ɵfac
});
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NGXLoggerMapperService, [{
    type: Injectable
  }], function() {
    return [{
      type: HttpBackend,
      decorators: [{
        type: Optional
      }]
    }];
  }, null);
})();
var TOKEN_LOGGER_METADATA_SERVICE = "TOKEN_LOGGER_METADATA_SERVICE";
var NGXLoggerMetadataService = class {
  constructor(datePipe) {
    this.datePipe = datePipe;
  }
  computeTimestamp(config) {
    const defaultTimestamp = () => (/* @__PURE__ */ new Date()).toISOString();
    if (config.timestampFormat) {
      if (!this.datePipe) {
        console.error("NGXLogger : Can't use timeStampFormat because DatePipe is not provided. You need to provide DatePipe");
        return defaultTimestamp();
      } else {
        return this.datePipe.transform(/* @__PURE__ */ new Date(), config.timestampFormat);
      }
    }
    return defaultTimestamp();
  }
  getMetadata(level, config, message, additional) {
    const metadata = {
      level,
      additional
    };
    if (message && typeof message === "function") {
      metadata.message = message();
    } else {
      metadata.message = message;
    }
    metadata.timestamp = this.computeTimestamp(config);
    return metadata;
  }
};
NGXLoggerMetadataService.ɵfac = function NGXLoggerMetadataService_Factory(__ngFactoryType__) {
  return new (__ngFactoryType__ || NGXLoggerMetadataService)(ɵɵinject(DatePipe, 8));
};
NGXLoggerMetadataService.ɵprov = ɵɵdefineInjectable({
  token: NGXLoggerMetadataService,
  factory: NGXLoggerMetadataService.ɵfac
});
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NGXLoggerMetadataService, [{
    type: Injectable
  }], function() {
    return [{
      type: DatePipe,
      decorators: [{
        type: Optional
      }]
    }];
  }, null);
})();
var NGXLoggerMonitor = class {
};
var TOKEN_LOGGER_RULES_SERVICE = "TOKEN_LOGGER_RULES_SERVICE";
var NGXLoggerRulesService = class {
  shouldCallWriter(level, config, message, additional) {
    return !config.disableConsoleLogging && level >= config.level;
  }
  shouldCallServer(level, config, message, additional) {
    return !!config.serverLoggingUrl && level >= config.serverLogLevel;
  }
  shouldCallMonitor(level, config, message, additional) {
    return this.shouldCallWriter(level, config, message, additional) || this.shouldCallServer(level, config, message, additional);
  }
};
NGXLoggerRulesService.ɵfac = function NGXLoggerRulesService_Factory(__ngFactoryType__) {
  return new (__ngFactoryType__ || NGXLoggerRulesService)();
};
NGXLoggerRulesService.ɵprov = ɵɵdefineInjectable({
  token: NGXLoggerRulesService,
  factory: NGXLoggerRulesService.ɵfac
});
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NGXLoggerRulesService, [{
    type: Injectable
  }], null, null);
})();
var TOKEN_LOGGER_SERVER_SERVICE = "TOKEN_LOGGER_SERVER_SERVICE";
var NGXLoggerServerService = class {
  constructor(httpBackend, ngZone) {
    this.httpBackend = httpBackend;
    this.ngZone = ngZone;
    this.serverCallsQueue = [];
    this.flushingQueue = new BehaviorSubject(false);
  }
  ngOnDestroy() {
    if (this.flushingQueue) {
      this.flushingQueue.complete();
      this.flushingQueue = null;
    }
    if (this.addToQueueTimer) {
      this.addToQueueTimer.unsubscribe();
      this.addToQueueTimer = null;
    }
  }
  /**
   * Transforms an error object into a readable string (taking only the stack)
   * This is needed because JSON.stringify would return "{}"
   * @param err the error object
   * @returns The stack of the error
   */
  secureErrorObject(err) {
    return err?.stack;
  }
  /**
   * Transforms the additional parameters to avoid any json error when sending the data to the server
   * Basically it just replaces unstringifiable object to a string mentioning an error
   * @param additional The additional data to be sent
   * @returns The additional data secured
   */
  secureAdditionalParameters(additional) {
    if (additional === null || additional === void 0) {
      return null;
    }
    return additional.map((next, idx) => {
      try {
        if (next instanceof Error) {
          return this.secureErrorObject(next);
        }
        if (typeof next === "object") {
          JSON.stringify(next);
        }
        return next;
      } catch (e) {
        return `The additional[${idx}] value could not be parsed using JSON.stringify().`;
      }
    });
  }
  /**
   * Transforms the message so that it can be sent to the server
   * @param message the message to be sent
   * @returns the message secured
   */
  secureMessage(message) {
    try {
      if (message instanceof Error) {
        return this.secureErrorObject(message);
      }
      if (typeof message !== "string") {
        message = JSON.stringify(message, null, 2);
      }
    } catch (e) {
      message = 'The provided "message" value could not be parsed with JSON.stringify().';
    }
    return message;
  }
  /**
   * Edits HttpRequest object before sending request to server
   * @param httpRequest default request object
   * @returns altered httprequest
   */
  alterHttpRequest(httpRequest) {
    return httpRequest;
  }
  /**
   * Sends request to server
   * @param url
   * @param logContent
   * @param options
   * @returns
   */
  logOnServer(url, logContent, options) {
    if (!this.httpBackend) {
      console.error("NGXLogger : Can't log on server because HttpBackend is not provided. You need to import HttpClientModule");
      return of(null);
    }
    let defaultRequest = new HttpRequest("POST", url, logContent, options || {});
    let finalRequest = of(defaultRequest);
    const alteredRequest = this.alterHttpRequest(defaultRequest);
    if (isObservable(alteredRequest)) {
      finalRequest = alteredRequest;
    } else if (alteredRequest) {
      finalRequest = of(alteredRequest);
    } else {
      console.warn("NGXLogger : alterHttpRequest returned an invalid request. Using default one instead");
    }
    return finalRequest.pipe(concatMap((req) => {
      if (!req) {
        console.warn("NGXLogger : alterHttpRequest returned an invalid request (observable). Using default one instead");
        return this.httpBackend.handle(defaultRequest);
      }
      return this.httpBackend.handle(req);
    }), filter((e) => e instanceof HttpResponse), map((httpResponse) => httpResponse.body));
  }
  /**
   * Customise the data sent to the API
   * @param metadata the data provided by NGXLogger
   * @returns the data that will be sent to the API in the body
   */
  customiseRequestBody(metadata) {
    return metadata;
  }
  /**
   * Flush the queue of the logger
   * @param config
   */
  flushQueue(config) {
    this.flushingQueue.next(true);
    if (this.addToQueueTimer) {
      this.addToQueueTimer.unsubscribe();
      this.addToQueueTimer = null;
    }
    if (!!this.serverCallsQueue && this.serverCallsQueue.length > 0) {
      this.sendToServerAction(this.serverCallsQueue, config);
    }
    this.serverCallsQueue = [];
    this.flushingQueue.next(false);
  }
  sendToServerAction(metadata, config) {
    let requestBody;
    const secureMetadata = (pMetadata) => {
      const securedMetadata = __spreadValues({}, pMetadata);
      securedMetadata.additional = this.secureAdditionalParameters(securedMetadata.additional);
      securedMetadata.message = this.secureMessage(securedMetadata.message);
      return securedMetadata;
    };
    if (Array.isArray(metadata)) {
      requestBody = [];
      metadata.forEach((m) => {
        requestBody.push(secureMetadata(m));
      });
    } else {
      requestBody = secureMetadata(metadata);
    }
    requestBody = this.customiseRequestBody(requestBody);
    const headers = config.customHttpHeaders || new HttpHeaders();
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    const logOnServerAction = () => {
      this.logOnServer(config.serverLoggingUrl, requestBody, {
        headers,
        params: config.customHttpParams || new HttpParams(),
        responseType: config.httpResponseType || "json",
        withCredentials: config.withCredentials || false
      }).pipe(catchError((err) => {
        console.error("NGXLogger: Failed to log on server", err);
        return throwError(err);
      })).subscribe();
    };
    if (config.serverCallsOutsideNgZone === true) {
      if (!this.ngZone) {
        console.error("NGXLogger: NgZone is not provided and serverCallsOutsideNgZone is set to true");
        return;
      }
      this.ngZone.runOutsideAngular(logOnServerAction);
    } else {
      logOnServerAction();
    }
  }
  /**
   * Sends the content to be logged to the server according to the config
   * @param metadata
   * @param config
   */
  sendToServer(metadata, config) {
    if ((!config.serverCallsBatchSize || config.serverCallsBatchSize <= 0) && (!config.serverCallsTimer || config.serverCallsTimer <= 0)) {
      this.sendToServerAction(metadata, config);
      return;
    }
    const addLogToQueueAction = () => {
      this.serverCallsQueue.push(__spreadValues({}, metadata));
      if (!!config.serverCallsBatchSize && this.serverCallsQueue.length > config.serverCallsBatchSize) {
        this.flushQueue(config);
      }
      if (config.serverCallsTimer > 0 && !this.addToQueueTimer) {
        this.addToQueueTimer = timer(config.serverCallsTimer).subscribe((_) => {
          this.flushQueue(config);
        });
      }
    };
    if (this.flushingQueue.value === true) {
      this.flushingQueue.pipe(filter((fq) => fq === false), take(1)).subscribe((_) => {
        addLogToQueueAction();
      });
    } else {
      addLogToQueueAction();
    }
  }
};
NGXLoggerServerService.ɵfac = function NGXLoggerServerService_Factory(__ngFactoryType__) {
  return new (__ngFactoryType__ || NGXLoggerServerService)(ɵɵinject(HttpBackend, 8), ɵɵinject(NgZone, 8));
};
NGXLoggerServerService.ɵprov = ɵɵdefineInjectable({
  token: NGXLoggerServerService,
  factory: NGXLoggerServerService.ɵfac
});
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NGXLoggerServerService, [{
    type: Injectable
  }], function() {
    return [{
      type: HttpBackend,
      decorators: [{
        type: Optional
      }]
    }, {
      type: NgZone,
      decorators: [{
        type: Optional
      }]
    }];
  }, null);
})();
var TOKEN_LOGGER_WRITER_SERVICE = "TOKEN_LOGGER_WRITER_SERVICE";
var NgxLoggerLevel;
(function(NgxLoggerLevel2) {
  NgxLoggerLevel2[NgxLoggerLevel2["TRACE"] = 0] = "TRACE";
  NgxLoggerLevel2[NgxLoggerLevel2["DEBUG"] = 1] = "DEBUG";
  NgxLoggerLevel2[NgxLoggerLevel2["INFO"] = 2] = "INFO";
  NgxLoggerLevel2[NgxLoggerLevel2["LOG"] = 3] = "LOG";
  NgxLoggerLevel2[NgxLoggerLevel2["WARN"] = 4] = "WARN";
  NgxLoggerLevel2[NgxLoggerLevel2["ERROR"] = 5] = "ERROR";
  NgxLoggerLevel2[NgxLoggerLevel2["FATAL"] = 6] = "FATAL";
  NgxLoggerLevel2[NgxLoggerLevel2["OFF"] = 7] = "OFF";
})(NgxLoggerLevel || (NgxLoggerLevel = {}));
var DEFAULT_COLOR_SCHEME = ["purple", "teal", "gray", "gray", "red", "red", "red"];
var NGXLoggerWriterService = class {
  constructor(platformId) {
    this.platformId = platformId;
    this.prepareMetaStringFuncs = [this.getTimestampToWrite, this.getLevelToWrite, this.getFileDetailsToWrite, this.getContextToWrite];
    this.isIE = isPlatformBrowser(platformId) && navigator && navigator.userAgent && !!(navigator.userAgent.indexOf("MSIE") !== -1 || navigator.userAgent.match(/Trident\//) || navigator.userAgent.match(/Edge\//));
    this.logFunc = this.isIE ? this.logIE.bind(this) : this.logModern.bind(this);
  }
  getTimestampToWrite(metadata, config) {
    return metadata.timestamp;
  }
  getLevelToWrite(metadata, config) {
    return NgxLoggerLevel[metadata.level];
  }
  getFileDetailsToWrite(metadata, config) {
    return config.disableFileDetails === true ? "" : `[${metadata.fileName}:${metadata.lineNumber}:${metadata.columnNumber}]`;
  }
  getContextToWrite(metadata, config) {
    return config.context ? `{${config.context}}` : "";
  }
  /** Generate a "meta" string that is displayed before the content sent to the log function */
  prepareMetaString(metadata, config) {
    let metaString = "";
    this.prepareMetaStringFuncs.forEach((prepareMetaStringFunc) => {
      const metaItem = prepareMetaStringFunc(metadata, config);
      if (metaItem) {
        metaString = metaString + " " + metaItem;
      }
    });
    return metaString.trim();
  }
  /** Get the color to use when writing to console */
  getColor(metadata, config) {
    const configColorScheme = config.colorScheme ?? DEFAULT_COLOR_SCHEME;
    if (metadata.level === NgxLoggerLevel.OFF) {
      return void 0;
    }
    return configColorScheme[metadata.level];
  }
  /** Log to the console specifically for IE */
  logIE(metadata, config, metaString) {
    const additional = metadata.additional || [];
    switch (metadata.level) {
      case NgxLoggerLevel.WARN:
        console.warn(`${metaString} `, metadata.message, ...additional);
        break;
      case NgxLoggerLevel.ERROR:
      case NgxLoggerLevel.FATAL:
        console.error(`${metaString} `, metadata.message, ...additional);
        break;
      case NgxLoggerLevel.INFO:
        console.info(`${metaString} `, metadata.message, ...additional);
        break;
      default:
        console.log(`${metaString} `, metadata.message, ...additional);
    }
  }
  /** Log to the console */
  logModern(metadata, config, metaString) {
    const color = this.getColor(metadata, config);
    const additional = metadata.additional || [];
    switch (metadata.level) {
      case NgxLoggerLevel.WARN:
        console.warn(`%c${metaString}`, `color:${color}`, metadata.message, ...additional);
        break;
      case NgxLoggerLevel.ERROR:
      case NgxLoggerLevel.FATAL:
        console.error(`%c${metaString}`, `color:${color}`, metadata.message, ...additional);
        break;
      case NgxLoggerLevel.INFO:
        console.info(`%c${metaString}`, `color:${color}`, metadata.message, ...additional);
        break;
      //  Disabling console.trace since the stack trace is not helpful. it is showing the stack trace of
      // the console.trace statement
      // case NgxLoggerLevel.TRACE:
      //   console.trace(`%c${metaString}`, `color:${color}`, message, ...additional);
      //   break;
      case NgxLoggerLevel.DEBUG:
        console.debug(`%c${metaString}`, `color:${color}`, metadata.message, ...additional);
        break;
      default:
        console.log(`%c${metaString}`, `color:${color}`, metadata.message, ...additional);
    }
  }
  /** Write the content sent to the log function to the console */
  writeMessage(metadata, config) {
    const metaString = this.prepareMetaString(metadata, config);
    this.logFunc(metadata, config, metaString);
  }
};
NGXLoggerWriterService.ɵfac = function NGXLoggerWriterService_Factory(__ngFactoryType__) {
  return new (__ngFactoryType__ || NGXLoggerWriterService)(ɵɵinject(PLATFORM_ID));
};
NGXLoggerWriterService.ɵprov = ɵɵdefineInjectable({
  token: NGXLoggerWriterService,
  factory: NGXLoggerWriterService.ɵfac
});
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NGXLoggerWriterService, [{
    type: Injectable
  }], function() {
    return [{
      type: void 0,
      decorators: [{
        type: Inject,
        args: [PLATFORM_ID]
      }]
    }];
  }, null);
})();
var NGXLogger = class {
  constructor(config, configEngineFactory, metadataService, ruleService, mapperService, writerService, serverService) {
    this.metadataService = metadataService;
    this.ruleService = ruleService;
    this.mapperService = mapperService;
    this.writerService = writerService;
    this.serverService = serverService;
    this.configEngine = configEngineFactory.provideConfigEngine(config);
  }
  /** Get a readonly access to the level configured for the NGXLogger */
  get level() {
    return this.configEngine.level;
  }
  /** Get a readonly access to the serverLogLevel configured for the NGXLogger */
  get serverLogLevel() {
    return this.configEngine.serverLogLevel;
  }
  trace(message, ...additional) {
    this._log(NgxLoggerLevel.TRACE, message, additional);
  }
  debug(message, ...additional) {
    this._log(NgxLoggerLevel.DEBUG, message, additional);
  }
  info(message, ...additional) {
    this._log(NgxLoggerLevel.INFO, message, additional);
  }
  log(message, ...additional) {
    this._log(NgxLoggerLevel.LOG, message, additional);
  }
  warn(message, ...additional) {
    this._log(NgxLoggerLevel.WARN, message, additional);
  }
  error(message, ...additional) {
    this._log(NgxLoggerLevel.ERROR, message, additional);
  }
  fatal(message, ...additional) {
    this._log(NgxLoggerLevel.FATAL, message, additional);
  }
  /** @deprecated customHttpHeaders is now part of the config, this should be updated via @see updateConfig */
  setCustomHttpHeaders(headers) {
    const config = this.getConfigSnapshot();
    config.customHttpHeaders = headers;
    this.updateConfig(config);
  }
  /** @deprecated customHttpParams is now part of the config, this should be updated via @see updateConfig */
  setCustomParams(params) {
    const config = this.getConfigSnapshot();
    config.customHttpParams = params;
    this.updateConfig(config);
  }
  /** @deprecated withCredentials is now part of the config, this should be updated via @see updateConfig */
  setWithCredentialsOptionValue(withCredentials) {
    const config = this.getConfigSnapshot();
    config.withCredentials = withCredentials;
    this.updateConfig(config);
  }
  /**
   * Register a INGXLoggerMonitor that will be trigger when a log is either written or sent to server
   *
   * There is only one monitor, registering one will overwrite the last one if there was one
   * @param monitor
   */
  registerMonitor(monitor) {
    this._loggerMonitor = monitor;
  }
  /** Set config of logger
   *
   * Warning : This overwrites all the config, if you want to update only one property, you should use @see getConfigSnapshot before
   */
  updateConfig(config) {
    this.configEngine.updateConfig(config);
  }
  partialUpdateConfig(partialConfig) {
    this.configEngine.partialUpdateConfig(partialConfig);
  }
  /** Get config of logger */
  getConfigSnapshot() {
    return this.configEngine.getConfig();
  }
  /**
   * Flush the serveur queue
   */
  flushServerQueue() {
    this.serverService.flushQueue(this.getConfigSnapshot());
  }
  _log(level, message, additional = []) {
    const config = this.configEngine.getConfig();
    const shouldCallWriter = this.ruleService.shouldCallWriter(level, config, message, additional);
    const shouldCallServer = this.ruleService.shouldCallServer(level, config, message, additional);
    const shouldCallMonitor = this.ruleService.shouldCallMonitor(level, config, message, additional);
    if (!shouldCallWriter && !shouldCallServer && !shouldCallMonitor) {
      return;
    }
    const metadata = this.metadataService.getMetadata(level, config, message, additional);
    this.mapperService.getLogPosition(config, metadata).pipe(take(1)).subscribe((logPosition) => {
      if (logPosition) {
        metadata.fileName = logPosition.fileName;
        metadata.lineNumber = logPosition.lineNumber;
        metadata.columnNumber = logPosition.columnNumber;
      }
      if (shouldCallMonitor && this._loggerMonitor) {
        this._loggerMonitor.onLog(metadata, config);
      }
      if (shouldCallWriter) {
        this.writerService.writeMessage(metadata, config);
      }
      if (shouldCallServer) {
        this.serverService.sendToServer(metadata, config);
      }
    });
  }
};
NGXLogger.ɵfac = function NGXLogger_Factory(__ngFactoryType__) {
  return new (__ngFactoryType__ || NGXLogger)(ɵɵinject(TOKEN_LOGGER_CONFIG), ɵɵinject(TOKEN_LOGGER_CONFIG_ENGINE_FACTORY), ɵɵinject(TOKEN_LOGGER_METADATA_SERVICE), ɵɵinject(TOKEN_LOGGER_RULES_SERVICE), ɵɵinject(TOKEN_LOGGER_MAPPER_SERVICE), ɵɵinject(TOKEN_LOGGER_WRITER_SERVICE), ɵɵinject(TOKEN_LOGGER_SERVER_SERVICE));
};
NGXLogger.ɵprov = ɵɵdefineInjectable({
  token: NGXLogger,
  factory: NGXLogger.ɵfac,
  providedIn: "root"
});
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NGXLogger, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], function() {
    return [{
      type: void 0,
      decorators: [{
        type: Inject,
        args: [TOKEN_LOGGER_CONFIG]
      }]
    }, {
      type: void 0,
      decorators: [{
        type: Inject,
        args: [TOKEN_LOGGER_CONFIG_ENGINE_FACTORY]
      }]
    }, {
      type: void 0,
      decorators: [{
        type: Inject,
        args: [TOKEN_LOGGER_METADATA_SERVICE]
      }]
    }, {
      type: void 0,
      decorators: [{
        type: Inject,
        args: [TOKEN_LOGGER_RULES_SERVICE]
      }]
    }, {
      type: void 0,
      decorators: [{
        type: Inject,
        args: [TOKEN_LOGGER_MAPPER_SERVICE]
      }]
    }, {
      type: void 0,
      decorators: [{
        type: Inject,
        args: [TOKEN_LOGGER_WRITER_SERVICE]
      }]
    }, {
      type: void 0,
      decorators: [{
        type: Inject,
        args: [TOKEN_LOGGER_SERVER_SERVICE]
      }]
    }];
  }, null);
})();
var CustomNGXLoggerService = class {
  constructor(logger, configEngineFactory, metadataService, ruleService, mapperService, writerService, serverService) {
    this.logger = logger;
    this.configEngineFactory = configEngineFactory;
    this.metadataService = metadataService;
    this.ruleService = ruleService;
    this.mapperService = mapperService;
    this.writerService = writerService;
    this.serverService = serverService;
  }
  /**
   * Create an instance of a logger
   * @deprecated this function does not have all the features, @see getNewInstance for every params available
   * @param config
   * @param serverService
   * @param logMonitor
   * @param mapperService
   * @returns
   */
  create(config, serverService, logMonitor, mapperService) {
    return this.getNewInstance({
      config,
      serverService,
      logMonitor,
      mapperService
    });
  }
  /**
   * Get a new instance of NGXLogger
   * @param params list of optional params to use when creating an instance of NGXLogger
   * @returns the new instance of NGXLogger
   */
  getNewInstance(params) {
    const logger = new NGXLogger(params?.config ?? this.logger.getConfigSnapshot(), params?.configEngineFactory ?? this.configEngineFactory, params?.metadataService ?? this.metadataService, params?.ruleService ?? this.ruleService, params?.mapperService ?? this.mapperService, params?.writerService ?? this.writerService, params?.serverService ?? this.serverService);
    if (params?.partialConfig) {
      logger.partialUpdateConfig(params.partialConfig);
    }
    if (params?.logMonitor) {
      logger.registerMonitor(params.logMonitor);
    }
    return logger;
  }
};
CustomNGXLoggerService.ɵfac = function CustomNGXLoggerService_Factory(__ngFactoryType__) {
  return new (__ngFactoryType__ || CustomNGXLoggerService)(ɵɵinject(NGXLogger), ɵɵinject(TOKEN_LOGGER_CONFIG_ENGINE_FACTORY), ɵɵinject(TOKEN_LOGGER_METADATA_SERVICE), ɵɵinject(TOKEN_LOGGER_RULES_SERVICE), ɵɵinject(TOKEN_LOGGER_MAPPER_SERVICE), ɵɵinject(TOKEN_LOGGER_WRITER_SERVICE), ɵɵinject(TOKEN_LOGGER_SERVER_SERVICE));
};
CustomNGXLoggerService.ɵprov = ɵɵdefineInjectable({
  token: CustomNGXLoggerService,
  factory: CustomNGXLoggerService.ɵfac,
  providedIn: "root"
});
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(CustomNGXLoggerService, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], function() {
    return [{
      type: NGXLogger
    }, {
      type: void 0,
      decorators: [{
        type: Inject,
        args: [TOKEN_LOGGER_CONFIG_ENGINE_FACTORY]
      }]
    }, {
      type: void 0,
      decorators: [{
        type: Inject,
        args: [TOKEN_LOGGER_METADATA_SERVICE]
      }]
    }, {
      type: void 0,
      decorators: [{
        type: Inject,
        args: [TOKEN_LOGGER_RULES_SERVICE]
      }]
    }, {
      type: void 0,
      decorators: [{
        type: Inject,
        args: [TOKEN_LOGGER_MAPPER_SERVICE]
      }]
    }, {
      type: void 0,
      decorators: [{
        type: Inject,
        args: [TOKEN_LOGGER_WRITER_SERVICE]
      }]
    }, {
      type: void 0,
      decorators: [{
        type: Inject,
        args: [TOKEN_LOGGER_SERVER_SERVICE]
      }]
    }];
  }, null);
})();
var LoggerModule = class _LoggerModule {
  static forRoot(config, customProvider) {
    if (!customProvider) {
      customProvider = {};
    }
    if (!customProvider.configProvider) {
      customProvider.configProvider = {
        provide: TOKEN_LOGGER_CONFIG,
        useValue: config || {}
      };
    } else {
      if (customProvider.configProvider.provide !== TOKEN_LOGGER_CONFIG) {
        throw new Error(`Wrong injection token for configProvider, it should be ${TOKEN_LOGGER_CONFIG} and you used ${customProvider.configProvider.provide}`);
      }
    }
    if (!customProvider.configEngineFactoryProvider) {
      customProvider.configEngineFactoryProvider = {
        provide: TOKEN_LOGGER_CONFIG_ENGINE_FACTORY,
        useClass: NGXLoggerConfigEngineFactory
      };
    } else {
      if (customProvider.configEngineFactoryProvider.provide !== TOKEN_LOGGER_CONFIG_ENGINE_FACTORY) {
        throw new Error(`Wrong injection token for configEngineFactoryProvider, it should be '${TOKEN_LOGGER_CONFIG_ENGINE_FACTORY}' and you used '${customProvider.configEngineFactoryProvider.provide}'`);
      }
    }
    if (!customProvider.metadataProvider) {
      customProvider.metadataProvider = {
        provide: TOKEN_LOGGER_METADATA_SERVICE,
        useClass: NGXLoggerMetadataService
      };
    } else {
      if (customProvider.metadataProvider.provide !== TOKEN_LOGGER_METADATA_SERVICE) {
        throw new Error(`Wrong injection token for metadataProvider, it should be '${TOKEN_LOGGER_METADATA_SERVICE}' and you used '${customProvider.metadataProvider.provide}'`);
      }
    }
    if (!customProvider.ruleProvider) {
      customProvider.ruleProvider = {
        provide: TOKEN_LOGGER_RULES_SERVICE,
        useClass: NGXLoggerRulesService
      };
    } else {
      if (customProvider.ruleProvider.provide !== TOKEN_LOGGER_RULES_SERVICE) {
        throw new Error(`Wrong injection token for ruleProvider, it should be '${TOKEN_LOGGER_RULES_SERVICE}' and you used '${customProvider.ruleProvider.provide}'`);
      }
    }
    if (!customProvider.mapperProvider) {
      customProvider.mapperProvider = {
        provide: TOKEN_LOGGER_MAPPER_SERVICE,
        useClass: NGXLoggerMapperService
      };
    } else {
      if (customProvider.mapperProvider.provide !== TOKEN_LOGGER_MAPPER_SERVICE) {
        throw new Error(`Wrong injection token for mapperProvider, it should be '${TOKEN_LOGGER_MAPPER_SERVICE}' and you used '${customProvider.mapperProvider.provide}'`);
      }
    }
    if (!customProvider.writerProvider) {
      customProvider.writerProvider = {
        provide: TOKEN_LOGGER_WRITER_SERVICE,
        useClass: NGXLoggerWriterService
      };
    } else {
      if (customProvider.writerProvider.provide !== TOKEN_LOGGER_WRITER_SERVICE) {
        throw new Error(`Wrong injection token for writerProvider, it should be '${TOKEN_LOGGER_WRITER_SERVICE}' and you used '${customProvider.writerProvider.provide}'`);
      }
    }
    if (!customProvider.serverProvider) {
      customProvider.serverProvider = {
        provide: TOKEN_LOGGER_SERVER_SERVICE,
        useClass: NGXLoggerServerService
      };
    } else {
      if (customProvider.serverProvider.provide !== TOKEN_LOGGER_SERVER_SERVICE) {
        throw new Error(`Wrong injection token for serverProvider, it should be '${TOKEN_LOGGER_SERVER_SERVICE}' and you used '${customProvider.writerProvider.provide}'`);
      }
    }
    return {
      ngModule: _LoggerModule,
      providers: [NGXLogger, customProvider.configProvider, customProvider.configEngineFactoryProvider, customProvider.metadataProvider, customProvider.ruleProvider, customProvider.mapperProvider, customProvider.writerProvider, customProvider.serverProvider, CustomNGXLoggerService]
    };
  }
  static forChild() {
    return {
      ngModule: _LoggerModule
    };
  }
};
LoggerModule.ɵfac = function LoggerModule_Factory(__ngFactoryType__) {
  return new (__ngFactoryType__ || LoggerModule)();
};
LoggerModule.ɵmod = ɵɵdefineNgModule({
  type: LoggerModule,
  imports: [CommonModule]
});
LoggerModule.ɵinj = ɵɵdefineInjector({
  imports: [[CommonModule]]
});
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(LoggerModule, [{
    type: NgModule,
    args: [{
      imports: [CommonModule]
    }]
  }], null, null);
})();
export {
  CustomNGXLoggerService,
  DEFAULT_COLOR_SCHEME,
  LoggerModule,
  NGXLogger,
  NGXLoggerConfigEngine,
  NGXLoggerConfigEngineFactory,
  NGXLoggerMapperService,
  NGXLoggerMetadataService,
  NGXLoggerMonitor,
  NGXLoggerRulesService,
  NGXLoggerServerService,
  NGXLoggerWriterService,
  NgxLoggerLevel,
  TOKEN_LOGGER_CONFIG,
  TOKEN_LOGGER_CONFIG_ENGINE_FACTORY,
  TOKEN_LOGGER_MAPPER_SERVICE,
  TOKEN_LOGGER_METADATA_SERVICE,
  TOKEN_LOGGER_RULES_SERVICE,
  TOKEN_LOGGER_SERVER_SERVICE,
  TOKEN_LOGGER_WRITER_SERVICE
};
//# sourceMappingURL=ngx-logger.js.map
