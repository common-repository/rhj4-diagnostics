(function ($) { // Hide scope, no $ conflict

    ///////////////////////////////////////////////////////////////////////////
    //
    //  CLOSURE OBJECTS
    //
    //  functions and objects visible to entire plugin
    //
    //  We need a single value to bootstrap ourselves.
    //
    var version = '1.0',
        containerName = 'persistentDictionaries',
        dictionaryName = 'persistentSettingsDictionary',
        dataSelector = '#persistentDictionaries',
        defaultCategory = 'default';

    ////////////////////////////////////////////////////////////////////////////////////////////////
    //
    //  PERSISTENT - get/set named persistent values
    //
    //  Author: Bob Jones, bob@rhj4.com
    //
    //  History:
    //      V1.0    10/2/2013   Created
    //
    //  Description:
    //      $.persistent is a global dictionary that stores keys and values.
    //      The dictionary is available to any other javascipt code.
    //
    //  Terminology:
    //      DICTIONARY: a named collection of handlers and items. 
    //      CATEGORY: the name of a dictionary
    //      HANDLER: a function that either gets and sets items or handles dirty items
    //      ITEM: a key with an associated value and optionally extra data
    //      KEY: a string that names a value
    //      VALUE: an object of any type except undefined
    //      EXTRA: an object of any type (including undefined)
    //
    ///////////////////////////////////////////////////////////////////////////////////////////////
    $.persistent = function (key, value, category, extra) {
        //
        //  Initialize data space
        //
        var options = $.persistent.defaults();
        if (key === undefined) {
            return options;
        }

        if (typeof key === 'object') {
            options = $.extend({}, options, key);
            if (options.values !== undefined && typeof options.values === 'object') {
                //  We are loading an array of key/value pairs. 
                //  Make sure category is included
                if (options.category === undefined) {
                    options.category = defaultCategory;
                }
            }
        } else if (typeof key === 'string') {
            options.key = key;
            options.value = value;
            options.category = category;
            options.extra = extra;
        } else {
            $.diagnostic('key must be a string');
            return;
        }

        var dictionary = initialize(options);

        //  Build list of current dictionary's handlers
        var storageHandler = undefined;
        var onDirtyHandler = undefined;
        $.each(dictionary.handlers, function (i, h) {
            if (h.type === 'storage') {
                if (typeof h.handler === 'function') {
                    if (storageHandler === undefined) {
                        storageHandler = h.handler;
                    } else {
                        $.diagnostic('multiple storage handlers not supported');
                    }
                }
            } else if (h.type = 'onDirty') {
                if (typeof h.handler === 'function') {
                    if (onDirtyHandler === undefined) {
                        onDirtyHandler = h.handler;
                    } else {
                        $.diagnostic('multiple onDirty handlers not supported');
                    }
                }
            }
        })

        if (storageHandler) {
            //
            //  Pass the selected dictionary to the handler and include
            //  the "extra" data, if any
            //
            var item = $.extend({}, defaultItem, options, dictionary);

            if (typeof options.values === 'object' && options.values.length > 0) {
                var results = [];
                $.each(options.values, function (i, v) {
                    item = storageHandler({
                        values: dictionary.values,
                        key: v.key,
                        value: v.value,
                        extra: v.extra,
                        onDirty: onDirtyHandler
                    });

                    results.push(item);
                })

                return results;

            } else {
                item.onDirty = onDirtyHandler;
                item = storageHandler(item);
                return item;
            }
        }

        $.diagnostic('no handler found for dictionary category [' + dictionary.category + ']');
        return false;
    }

    ///////////////////////////////////////////////////////////////////////////
    //
    //  PUBLIC METHOD: defaults
    //
    //  Define default value names
    //
    $.persistent.defaults = function () {
        return {
            version: version,
            containerName: containerName,
            dictionaryName: dictionaryName,
            dataSelector: dataSelector,
            defaultCategory: defaultCategory
        };
    }

    ///////////////////////////////////////////////////////////////////////////
    //
    //  PUBLIC METHOD: options
    //
    //  Get / set all options
    //
    //  Save options in $.Persistent so they only have to be set only once.
    //
    $.persistent.options = function (options) {

        var dataSelector = $.persistent.defaults().dataSelector;
        if (options !== undefined) {
            $.persistent(dataSelector, options);
        }

        return $.persistent(dataSelector);
    }

    ///////////////////////////////////////////////////////////////////////////
    //
    //  PUBLIC METHOD: options
    //
    //  Get/Set single option
    //
    $.persistent.option = function (key, value) {
        var options = $.persistent.options();
        if (options.key !== undefined) {
            if (value !== undefined) {
                options.key = value;
                $.persistent.options(options);
            } else {
                return options.key;
            }
        }
    }

    ///////////////////////////////////////////////////////////////////////////
    //
    //  PUBLIC METHOD: create
    //
    //  Creates a new dictionary. 
    //
    //  Arguments:
    // 
    //      category == string -->  create a dictionary using default values 
    //                              with the category name set to this value
    //
    //      category == object -->  create a new dictionary using category
    //                              as the fully formed defininition of
    //                              the dictionary. 
    //                              The object must be a valid category object 
    //                              but may have additional arguments that 
    //                              will be stored with it.
    //
    $.persistent.create = function (category) {
        if (category === undefined) {
            $.diagnostic('malformed arguments');
            return false;
        }

        var dictionary = defaultDictionary();
        if (typeof category === 'string') {
            dictionary.category = category;
        } else if (typeof category === 'object') {
            dictionary = $.extend({}, dictionary, category);
            if (dictionary.handlers === undefined || dictionary.handlers.length === 0) {
                dictionary.handlers = defaultHandlers();
            }
            if (!isValidDictionary(dictionary)) {
                $.diagnostic('malformed dictionary');
                return false;
            }
        } else {
            $.diagnostic('malformed arguments');
            return false;
        }

        //  dictionary now contains a valid dictionary.
        //  Make sure a dictionary of the same name 
        //  does not already exist.

        var dictionaries = getDictionaries(containerName);
        var duplicate = false;
        $.each(dictionaries, function (i, d) {
            if (d.category === dictionary.category) {
                duplicate = true;
                return false;
            }
        })

        if (duplicate) {
            $.diagnostic('dictionary already exists');
            return false;
        }

        dictionaries.push(dictionary)
        return true;
    }

    ///////////////////////////////////////////////////////////////////////////
    //
    //  PUBLIC METHOD: category
    // 
    //  if category is undefined, return an array of all current category names
    //  if category is a string, return corresponding dictionary
    //  if category is an object, validate it and either add it to dictionaries
    //      or update current dictionary
    //
    $.persistent.category = function (category) {
        var dictionaries = getDictionaries(containerName);

        if (category === undefined) {
            var categories = [];
            $.each(dictionaries, function (i, d) {
                categories.push(d.category);
            });

            return categories;
        }

        if (typeof category === 'string') {
            var dict;
            $.each(dictionaries, function (i, d) {
                if (d.category === category) {
                    dict = d;
                    return false;
                }
            })
            return dict;
        }

        if (typeof category === 'object') {
            if (!isValidDictionary(object)) {
                $.diagnostic('malformed arguments');
                return false;
            }

            var index = -1;
            $.each(dictionaries, function (i, d) {
                if (d.category === category) {
                    index = 1;
                    return false;
                }
            })
            if (index === -1) {
                dictionaries.push(category);
            } else {
                dictionaries[index] = category;
            }
            return true;
        }

        $.diagnostic('malformed arguments');
        return false;

    }

    ///////////////////////////////////////////////////////////////////////////
    //
    //  PUBLIC METHOD: dictionary
    // 
    //  Manage dictionaries
    //
    //  If category is undefined, return all current categories
    //  else create new dictionary using defaults.
    //
    //  If handlers undefined and not creating a new dictionary, 
    //      return list of handlers for cagegory
    //    
    //  If handlers are defined, they will replace current handler list
    //
    //  If values undefined and not creating a new dictionary, 
    //      return all values for category 
    //
    //  If values are defined, they will replace current set of values
    //
    //  return current dictionary
    //
    $.persistent.dictionary = function (category, handlers, values) {

        var dictionaries = getDictionaries(containerName);

        var options = { category: undefined, handlers: undefined, values: undefined };
        if (category === undefined) {
            return dictionaries;
        }

        if (typeof category === 'object') {
            options = $.extend({}, options, category);
            category = options.category;
            // ignore any additional arguments

        } else if (typeof category === 'string') {
            options.category = category;

            // handlers must be an object
            if (typeof handlers === 'object') {
                options.handlers = handlers;
            }

            // values must be an object
            if (typeof values === 'object') {
                options.values = values;
            }

        } else {
            $.diagnostic('malformed arguments');
            return false;
        }


        // Build array of all categories
        var categories = [];
        $.each(dictionaries, function (i, d) {
            categories.push(d.category);
        })

        if (options.category === undefined) {
            return categories;
        }

        // get the dictionary for category
        var dictionaryExists = false;
        var currentDictionary;
        var index = $.inArray(category, categories);
        if (index > -1) {
            currentDictionary = dictionaries[index];
            dictionaryExists = true;
        } else {
            currentDictionary = defaultDictionary();
            currentDictionary.category = category;
            dictionaries.push(currentDictionary);
        }

        if (dictionaryExists && handlers !== undefined) {
            currentDictionary.handlers = handlers;
        }

        if (dictionaryExists && values !== undefined) {
            currentDictionary.values = values;
        }

        return currentDictionary;
    }

    ///////////////////////////////////////////////////////////////////////////
    //
    //  PUBLIC METHOD: sort
    //
    $.persistent.sort = function (category) {
        var dictionary = getDictionary(containerName, category);
        if (dictionary === undefined) {
            $.diagnostic('no dictionary for category [' + category + ']');
            return false;
        }

        dictionary.values.sort(sortByKey);

        function sortByKey(a, b) {
            var aKey = a.key.toLowerCase();
            var bKey = b.key.toLowerCase();
            return ((aKey < bKey) ? -1 : ((aKey > bKey) ? 1 : 0));
        }
    }

    ///////////////////////////////////////////////////////////////////////////
    //
    //  PUBLIC METHOD: remove
    //
    //  Remove key from it's dictionary OR...
    //  Remove entire category (dictionary)
    //  arguments can be discrete or expressed as an object:
    //  
    //  examples: 
    //
    //      ('myCat','foo');                    <-- remove key
    //      ({key: 'foo', category: 'myCat'})   <-- remove key
    //      ({category: 'myCat'})               <-- remove category from dictionary
    //
    //  returns true if operation successful or false on failure
    //
    $.persistent.remove = function (category, key) {
        //
        //  Convert arguments to object
        //
        var options = { key: undefined, category: undefined };
        if (typeof category === 'object') {
            options = $.extend({}, options, category);
        } else if (typeof category === 'string') {
            options.category = category;
            options.key = key;
        } else {
            $.diagnostic('malformed arguments');
            return false;
        }

        if (options.key === undefined) {
            if (options.category !== undefined) {
                //
                // delete dictionary
                //
                var dictionaries = getDictionaries(containerName);

                // now remove category from dictionary set
                var index = -1;
                $.each(dictionaries, function (i, d) {
                    if (d.category === options.category) {
                        index = i;
                        return false;
                    }
                })

                if (index > -1) {
                    dictionaries.splice(index, 1);
                }

                return true;
            }

            $.diagnostic('malformed arguments');
            return false;
        }

        //
        //  Delete key from dictionary
        //
        var dictionary = getDictionary(containerName, options.category);
        if (dictionary === undefined) {
            $.diagnostic('category [' + options.category + '] is not currently defined');
            return false;
        }

        var index = keyIndex(key, dictionary.values);
        if (index > -1) {
            //
            //... DELETE CODE HERE:
            dictionary.values.splice(index, 1);
            return true;
        }

        $.diagnostic('malformed arguments');
        return false;
    }


    ///////////////////////////////////////////////////////////////////////////
    //
    //  PUBLIC METHOD: reset
    //
    //  Destroy all dictionaries
    //
    $.persistent.reset = function () {

        $(selector).removeData();
    }

    ///////////////////////////////////////////////////////////////////////////
    //
    //  PUBLIC METHOD: dirty
    //
    //  Sets or clears dirty flag for all items in a dictionary
    //
    $.persistent.dirty = function (category, set) {
        var dictionary = getDictionary(containerName, category)
        if (dictionary === undefined) {
            return;
        }

        set = set || false;
        $.each(dictionary.values, function (i, e) {
            e.isDirty = set;
        })
    }

    ///////////////////////////////////////////////////////////////////////////
    //
    //  INTERNAL DEFAULT FUNCTIONS
    //
    //  default settings
    //
    function defaultDictionary() {
        return {
            category: defaultCategory,
            handlers: [],
            values: []
        };
    }

    //
    //  List of handlers. Two types currently supported:
    //      storage - manages dictionary
    //      onDirty - called if a value changes
    //
    function defaultHandlers() {
        return [{ type: 'storage', handler: defaultStorageHandler}];
    }

    function defaultItem() {
        return {
            category: undefined,
            key: undefined,
            value: undefined,
            extra: undefined,
            onDirty: undefined,
            values: []
        };
    }

    ///////////////////////////////////////////////////////////////////////////
    //
    //  INTERNAL DEFAULT FUNCTION
    //
    //  Default storage handler function
    //
    //  performs get / set operations against the 
    //  supplied values. 
    //
    //  Since this function is within closure, it
    //  doesn't need to have the dictionary or category
    //  fed to it.
    //
    //  All handler APIs accept a single argument (options)
    //  which must look like this:
    //
    //      values:     current array of dictionary values
    //      key:        key of item to return or update
    //      value:      [new] value of item to update
    //      extra:      [optional] any additional data included
    //      onDirty:    [optional] handler that will be called
    //                  if item exists and has a new value
    //
    function defaultStorageHandler(options) {
        if (options.key === undefined) {
            return options.values;
        }

        var index = keyIndex(options.key, options.values);

        //
        //  This brute force algorithm is (admitedly) suboptimal,
        //  but I am apparently missing a clue somewhere on how
        //  to set this properly.
        //
        var item;
        if (options.value === undefined) {
            // if key not in values, value will be undefined
            item = options.values[index];
            if (item === undefined) {
                return undefined;
            }

            //  return the item
            return item;
        }

        item = {
            key: options.key,
            value: options.value,
            extra: options.extra,
            isDirty: false
        };

        if (index === -1) {
            //  New item
            options.values.push(item)
        } else {
            // Key is getting a new value
            item.isDirty = true;
            options.values[index] = item;           // so mark it as dirty
        }

        //
        //  Invoke the onDirty Handler (if defined)
        //
        if (item.isDirty && options.onDirty) {
            options.onDirty(item);
        }

        return item;
    }

    ///////////////////////////////////////////////////////////////////////////
    //
    //  INTERNAL DEFAULT FUNCTION
    //
    //  defaultOnDirtyHandler
    //
    //  Called whenever a key value is updated
    //
    function defaultOnDirtyHandler(options) {
        $.diagnostic('Key:' + options.key + '=' + options.value + '(dirty)');
    }

    ///////////////////// fs//////////////////////////////////////////////////////
    //
    //  INTERNAL UTILITY FUNCTION
    //
    //  Get all dictionaries in containerName
    //
    function getDictionaries(containerName) {
        var selector = '#' + containerName;
        var dictionaries = $(selector).data(containerName);
        if (dictionaries === undefined || dictionaries === null) {
            $('body').append("<input type='hidden' id='" + containerName + "'/>");

            //  Start fresh
            dictionaries = [];
            dictionaries.push(defaultDictionary());

            //  save empty dictionary
            $(selector).data(containerName, dictionaries);

            $.diagnostic(dictionaryName + ' dictionary created', 'persistent');
        }
        return dictionaries;
    }

    ///////////////////////////////////////////////////////////////////////////
    //
    //  INTERNAL UTILITY FUNCTION
    //
    //  Get a specific dictionary
    //
    function getDictionary(containerName, category) {
        var dictionaries = getDictionaries(containerName);
        if (dictionaries === undefined || dictionaries === null) {
            $('body').append("<input type='hidden' id='" + containerName + "'/>");

            //  Start fresh
            dictionaries = defaultDictionary();

            //  save empty dictionary
            $(selector).data(containerName, dictionaries);

            $.diagnostic('dictionary created', 'persistent');
        }

        //
        //  Get category dictionary
        //
        var currentDictionary;
        if (category === undefined) {
            if (options !== undefined) {
                if (typeof options === 'object') {
                    category = options.category;
                } else if (typeof options === 'string') {
                    category = options;
                }
            }
        }
        // if we still don't have a category, use default
        category = (category) ? category : defaultCategory;

        //  Find the correct dictionary
        $.each(dictionaries, function (i, d) {
            if (d.category === category) {
                currentDictionary = d;
                return false;
            }
        })

        if (currentDictionary === undefined) {
            return;
        }

        return currentDictionary;
    }

    ///////////////////////////////////////////////////////////////////////////
    //
    //  INTERNAL UTILITY FUNCTION
    //
    //  find the index of a key within a dictionary value array
    //
    function keyIndex(key, values) {
        var index = -1;
        $.each(values, function (i, v) {
            if (v.key === key) {
                index = i;
                return false;
            }
        })

        return index;
    }

    ///////////////////////////////////////////////////////////////////////////
    //
    //  INTERNAL UTILITY FUNCTION
    //
    //  validate dictionary structure
    //
    function isValidDictionary(dictionary) {

        if (!typeof dictionary.category === 'string') {
            $.daignostic('category must be a string');
            return false;
        }
        if (dictionary.handlers === undefined || dictionary.handlers.length == 0) {
            $.diagnostic('handlers are missing');
            return false;
        }

        if (dictionary.values === undefined) {
            $diagnostic('values are undefined');
            return false;
        }
        return true;
    }

    ///////////////////////////////////////////////////////////////////////////
    //
    //  INTERNAL UTILITY FUNCTION
    //
    //  Initialize persistent data space and return the appropriate dictionary 
    //  
    //
    function initialize(options) {
        //
        //  Establish frequently used values
        //
        version = options.version;
        containerName = options.containerName;          // DOM element property name
        selector = '#' + containerName;                  // DOM element where everything is stored
        dictionaryName = options.dictionaryName;        // Dictionary name for persistent settings
        defaultCategory = options.defaultCategory;      // The default dictionary name

        var dictionaries = [];

        var domElement = $(selector);
        if (domElement.length == 0) {
            //
            //  The data space is empty, so populate it with the default dictionary
            //
            $('body').append("<input type='hidden' id='" + containerName + "'/>");

            //  Create Default Dictionary
            var defaultDict = defaultDictionary();
            defaultDict.category = defaultCategory;
            defaultDict.handlers = defaultHandlers();
            dictionaries.push(defaultDict);
            $(selector).data(containerName, dictionaries);
        }

        if (options.category === undefined) {
            options.category = defaultCategory;
        }

        var dictionary;
        dictionaries = $(selector).data(containerName);
        $.each(dictionaries, function (i, d) {
            if (d.category === options.category) {
                dictionary = d;
                return false;
            }
        });

        if (dictionary === undefined) {
            //
            //  Dictionary not found. Create it
            //
            dictionary = defaultDictionary();
            dictionary.category = options.category;
            dictionaries.push(dictionary);
        }
        if (!dictionary.handlers || dictionary.handlers.length == 0) {
            dictionary.handlers = defaultHandlers();
        }

        return dictionary;
    }

})(jQuery);

///////////////////////////////////////////////////////////////////////////
//
//  ON READY HANDLER
//
jQuery(document).ready(function () {
    jQuery.diagnostic('version ' + jQuery.persistent().version, 'jQuery.Persistent.js');
});
