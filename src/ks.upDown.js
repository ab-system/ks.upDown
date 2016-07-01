
angular
    .module("ks.upDown", [])
    .value('upDownSettings', { templateUrl: 'src/templates/ks.updown.bootstrap.html' })
    .directive("upDown", [
        'upDownSettings', '$log', function (upDownSettings, $log) {
            var re = /^-?[0-9]\d*(\.\d+)?$/;

            function isNullOrUndefined(value){
                return angular.isUndefined(value) || value == null;
            }

            function addZero(str) {
                if(str[str.length - 1] == '.') {
                    return { result: str + '0', isReplaced: true };
                }
                else if(str[0] == '.') {
                    return { result: '0' + str, isReplaced: true };
                }
                return { result: str, isReplaced: false };
            }

            return {
                restrict: "EA",
                templateUrl: function(element, attrs){
                  return attrs.templateUrl ? attrs.templateUrl : upDownSettings.templateUrl;
                },

                require: 'ngModel',
                scope: {
                    step: '@',
                    decimalPlaces: '@',
                    max: '@',
                    min: '@',
                    default: '@',
                    label: '@',
                    onChange: '&?'
                },

                link: function link(scope, element, attrs, ngModelCtrl) {

                    function trace(message){
                        if(attrs.trace == '') {
                            $log.debug('upDown >> ' + message);
                        }
                    }

                    var step = scope.step ? parseFloat(scope.step) : 1;
                    var decimalPlaces = scope.decimalPlaces ? parseInt(scope.decimalPlaces) : 0;
                    var min, max;
                    if(!isNullOrUndefined(scope.min)) { min = parseFloat(scope.min); }
                    if(!isNullOrUndefined(scope.max)) { max = parseFloat(scope.max); }



                    function test(value) {
                        if (value != '' && value != '-' ) {
                            function minMaxTest() {
                                if (!isNullOrUndefined(min) && value < min) {
                                    trace('invalid value: ' + value + ', min value: ' + min);
                                    return {valid: false, rule: 'min'};
                                }
                                if (!isNullOrUndefined(max) && value > max) {
                                    trace('invalid value: ' + value + ', max value: ' + max);
                                    return {valid: false, rule: 'max'};
                                }
                                return {valid: true}
                            }

                            if (angular.isString(value)) {
                                /*
                                 * для корректной работы валидации, заначени .123 превращаем в 0.123, а 123. в 123.0
                                 * */
                                var addZeroResult = addZero(value);
                                /*если заменя состоялась, то проверку мин, макс проводить не надо, т.к. например 0. превратится в 0.0,
                                 * а это может быть меньше min
                                 * */
                                if (addZeroResult.isReplaced) {
                                    trace('add zero to ' + value + ', new value: ' + addZeroResult.result);
                                    value = addZeroResult.result;
                                }
                                else {
                                    value = parseFloat(value);
                                    var minMax = minMaxTest();
                                    if (!minMax.valid) {
                                        return minMax;
                                    }
                                }

                            }
                            else {
                                var minMax = minMaxTest();
                                if (!minMax.valid) {
                                    return minMax;
                                }
                            }

                            var isDigit = re.test(value);
                            if (!isDigit) {
                                trace('invalid value: ' + value + ' must be a digit');
                                return {valid: false, rule: 'isDigit'};
                            }
                        }
                        return { valid: true };
                    }

                    if(scope.default && !test(scope.default).valid){
                        throw 'invalid default value';
                    }

                    scope.onBlur = function() {
                        if(scope.viewValue == '' && scope.default){
                            trace('set default value');
                            scope.viewValue = scope.default;
                        }
                        var addZeroResult = addZero(scope.viewValue);
                        if (addZeroResult.isReplaced) {
                            scope.viewValue = addZeroResult.result;
                            var testResult = test(scope.viewValue);
                            if (!testResult.valid) {
                                if (testResult.rule == 'min') {
                                    scope.viewValue = min;
                                }
                                else {
                                    scope.viewValue = max;
                                }
                            }
                        }
                        trace('onBlur');

                        ngModelCtrl.$setViewValue(scope.viewValue);
                    }

                    ngModelCtrl.$formatters.push(function (modelValue) {

                        if(isNullOrUndefined(modelValue)){
                            modelValue = isNullOrUndefined(min) ? 0 : min;
                        }

                        if(!test(modelValue)) {
                            throw 'invalid model value: ' + modelValue;
                        }
                        return parseFloat(modelValue);
                    });

                    ngModelCtrl.$render = function () {
                        scope.viewValue = ngModelCtrl.$viewValue;
                    };

                    ngModelCtrl.$parsers.push(function (viewValue) {
                        return viewValue;
                    });

                    scope.$watch('viewValue', function (_new, old) {
                        trace("$watch('viewValue'");
                        if(!isNullOrUndefined(_new) && !test(_new).valid) {
                            trace('set old value')
                            scope.viewValue = old;
                        }
                        else if(_new != old/* && re.test(old)*/) {
                            ngModelCtrl.$setViewValue(_new);
                            if(angular.isFunction(scope.onChange)){
                                trace('call onChange');
                                scope.onChange({ newValue: _new });
                            }
                        }
                    });

                    function inc(val){
                        if(!angular.isNumber(scope.viewValue)){
                            scope.viewValue = parseFloat(scope.viewValue);
                        }
                        scope.viewValue = parseFloat((scope.viewValue + val).toFixed(decimalPlaces))
                    }

                    scope.up = function() {
                        inc(step);
                    }

                    scope.down = function() {
                        inc(-step);
                    }
                }
            };
        }
    ]);