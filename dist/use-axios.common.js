'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var React = require('react');
var React__default = _interopDefault(React);
var Axios = _interopDefault(require('axios'));

var isObject = function (o) { return Object.prototype.toString.call(o) === '[object Object]'; };

var AxiosContext = React__default.createContext(null);
var AxiosConfig = function (props) {
    var config = props.config, instance = props.instance, options = props.options;
    var axiosInstanceRef = React.useRef();
    var globalOptions = options;
    if (instance) {
        axiosInstanceRef.current = instance;
    }
    else if (config && isObject(config)) {
        axiosInstanceRef.current = Axios.create(config);
    }
    else {
        axiosInstanceRef.current = Axios.create();
    }
    return React__default.createElement(AxiosContext.Provider, { value: { axiosInstance: axiosInstanceRef.current, globalOptions: globalOptions } }, props.children);
};

/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */

var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};

var ActionEnum;
(function (ActionEnum) {
    ActionEnum["REQUEST_START"] = "REQUEST_START";
    ActionEnum["REQUEST_SUCCESS"] = "REQUEST_SUCCESS";
    ActionEnum["REQUEST_ERROR"] = "REQUEST_ERROR";
    ActionEnum["REQUEST_CANCEL"] = "REQUEST_CANCEL";
})(ActionEnum || (ActionEnum = {}));
function normalizeConfig(config) {
    if (typeof config === 'string') {
        // only url
        return { url: config };
    }
    else {
        return config;
    }
}
// useAxios
function useAxios(config, options, dependencies) {
    var globalConfig = React.useContext(AxiosContext) || {};
    var axiosConfig = normalizeConfig(config);
    var initialOptions = __assign({ trigger: true, cancelable: false }, globalConfig.globalOptions);
    var hookOptions = Array.isArray(options) ? initialOptions : __assign(__assign({}, initialOptions), options);
    var axiosInstance = globalConfig.axiosInstance || Axios.create();
    var deps = Array.isArray(options) ? options : dependencies;
    var cancelSource = React.useRef();
    var reducer = React.useCallback(function (state, action) {
        switch (action.type) {
            case ActionEnum.REQUEST_START:
                return __assign(__assign({}, state), { loading: true, response: undefined, error: undefined, isCancel: false });
            case ActionEnum.REQUEST_SUCCESS:
                return __assign(__assign({}, state), { loading: false, response: action.payload, error: undefined, isCancel: false });
            case ActionEnum.REQUEST_ERROR:
                return __assign(__assign({}, state), { loading: false, response: undefined, error: action.payload, isCancel: false });
            case ActionEnum.REQUEST_CANCEL:
                return __assign(__assign({}, state), { loading: false, response: undefined, error: action.payload, isCancel: true });
            default:
                return state;
        }
    }, []);
    var _a = React.useReducer(reducer, {
        response: undefined,
        error: undefined,
        loading: false,
        isCancel: false,
    }), state = _a[0], dispatch = _a[1];
    var refresh = React.useCallback(function (overwriteConfig, overwriteOptions /* for further use*/) {
        // if should cancel, cancel last request
        if (cancelSource.current) {
            cancelSource.current.cancel();
        }
        var options = __assign(__assign({}, hookOptions), overwriteOptions);
        // add new cancel source
        cancelSource.current = options.cancelable ? Axios.CancelToken.source() : undefined;
        dispatch({ type: ActionEnum.REQUEST_START });
        return axiosInstance
            .request(__assign(__assign(__assign({}, axiosConfig), normalizeConfig(overwriteConfig)), { cancelToken: (cancelSource.current || {}).token }))
            .then(function (res) {
            dispatch({
                type: ActionEnum.REQUEST_SUCCESS,
                payload: res,
            });
            return res;
        })["catch"](function (error) {
            if (Axios.isCancel(error)) {
                dispatch({
                    type: ActionEnum.REQUEST_CANCEL,
                    payload: error,
                });
            }
            dispatch({
                type: ActionEnum.REQUEST_ERROR,
                payload: error,
            });
            throw error;
        });
    }, deps);
    // start request
    React.useEffect(function () {
        var shouldFetch = typeof hookOptions.trigger === 'function' ? hookOptions.trigger() : hookOptions.trigger;
        if (shouldFetch) {
            refresh();
        }
    }, deps);
    return [state, refresh];
}

exports.AxiosConfig = AxiosConfig;
exports.default = useAxios;
