var vows = require('vows');
var assert = require('assert');
var Tokenizer = require('../../lib/selectors/tokenizer');
var SourceTracker = require('../../lib/utils/source-tracker');

function tokenizerContext(name, specs, addMetadata) {
  var ctx = {};

  function tokenized(target) {
    return function (source) {
      var tokenized = new Tokenizer({ options: {}, sourceTracker: new SourceTracker(), warnings: [] }, addMetadata).toTokens(source);
      assert.deepEqual(target, tokenized);
    };
  }

  for (var test in specs) {
    ctx[test] = {
      topic: specs[test][0],
      tokenized: tokenized(specs[test][1])
    };
  }

  return ctx;
}

vows.describe(Tokenizer)
  .addBatch(
    tokenizerContext('basic', {
      'no content': [
        '',
        []
      ],
      'an escaped content': [
        '__ESCAPED_COMMENT_CLEAN_CSS0__',
        []
      ],
      'an escaped content followed by a break': [
        '__ESCAPED_COMMENT_CLEAN_CSS0__\n',
        []
      ],
      'an empty selector': [
        'a{}',
        [{
          kind: 'selector',
          value: [{ value: 'a' }],
          body: []
        }]
      ],
      'an empty selector with whitespace': [
        'a{ \n  }',
        [{
          kind: 'selector',
          value: [{ value: 'a' }],
          body: []
        }]
      ],
      'a selector': [
        'a{color:red}',
        [{
          kind: 'selector',
          value: [{ value: 'a' }],
          body: [{ value: 'color:red' }]
        }]
      ],
      'a selector with whitespace': [
        'a {color:red;\n\ndisplay :\r\n  block }',
        [{
          kind: 'selector',
          value: [{ value: 'a ' }],
          body: [
            { value: 'color:red' },
            { value: 'display:block'
          }]
        }]
      ],
      'a selector with suffix whitespace': [
        'div a{color:red\r\n}',
        [{ kind: 'selector', value: [{ value: 'div a' }], body: [{ value: 'color:red' }] }]
      ],
      'a selector with whitespace in functions': [
        'a{color:rgba( 255, 255, 0, 0.5  )}',
        [{
          kind: 'selector',
          value: [{ value: 'a' }],
          body: [{ value: 'color:rgba(255,255,0,0.5)' }]
        }]
      ],
      'a selector with empty properties': [
        'a{color:red; ; ; ;}',
        [{
          kind: 'selector',
          value: [{ value: 'a' }],
          body: [{ value: 'color:red' }]
        }]
      ],
      'a selector with quoted attribute': [
        'a[data-kind=__ESCAPED_FREE_TEXT_CLEAN_CSS0__]{color:red}',
        [{
          kind: 'selector',
          value: [{ value: 'a[data-kind=__ESCAPED_FREE_TEXT_CLEAN_CSS0__]' }],
          body: [{ value: 'color:red' }]
        }]
      ],
      'a selector with escaped quote': [
        '.this-class\\\'s-got-an-apostrophe{}',
        [{
          kind: 'selector',
          value: [{ value: '.this-class\\\'s-got-an-apostrophe' }],
          body: []
        }]
      ],
      'a double selector': [
        'a,\n\ndiv.class > p {color:red}',
        [{
          kind: 'selector',
          value: [
            { value: 'a' },
            { value: '\n\ndiv.class > p ' }
          ],
          body: [{ value: 'color:red' }]
        }]
      ],
      'two selectors': [
        'a{color:red}div{color:blue}',
        [
          {
            kind: 'selector',
            value: [{ value: 'a' }],
            body: [{ value: 'color:red' }]
          },
          {
            kind: 'selector',
            value: [{ value: 'div' }],
            body: [{ value: 'color:blue' }]
          }
        ]
      ],
      'two comments and a selector separated by newline': [
        '__ESCAPED_COMMENT_CLEAN_CSS0__\n__ESCAPED_COMMENT_CLEAN_CSS1__\ndiv{}',
        [
          {
            kind: 'selector',
            value: [{ value: 'div' }],
            body: []
          }
        ]
      ],
      'two properties wrapped between comments': [
        'div{__ESCAPED_COMMENT_SPECIAL_CLEAN_CSS0__color:red__ESCAPED_COMMENT_SPECIAL_CLEAN_CSS1__}',
        [{
          kind: 'selector',
          value: [{ value: 'div' }],
          body: [
            { value: '__ESCAPED_COMMENT_SPECIAL_CLEAN_CSS0__' },
            { value: 'color:red' },
            { value: '__ESCAPED_COMMENT_SPECIAL_CLEAN_CSS1__' }
          ]
        }]
      ],
      'pseudoselector after an argument one': [
        'div:nth-child(2n):not(.test){}',
        [{
          kind: 'selector',
          value: [{ value: 'div:nth-child(2n):not(.test)' }],
          body: []
        }]
      ],
      'media query': [
        '@media (min-width:980px){}',
        [{
          kind: 'block',
          value: '@media (min-width:980px)',
          body: [],
          isFlatBlock: false
        }]
      ],
      'media query with selectors': [
        '@media (min-width:980px){a{color:red}}',
        [{
          kind: 'block',
          value: '@media (min-width:980px)',
          body: [{
            kind: 'selector',
            value: [{ value: 'a' }],
            body: [{ value: 'color:red' }]
          }],
          isFlatBlock: false
        }]
      ],
      'media query spanning more than one chunk': [
        '@media only screen and (max-width:1319px) and (min--moz-device-pixel-ratio:1.5),only screen and (max-width:1319px) and (-moz-min-device-pixel-ratio:1.5){a{color:#000}}',
        [{
          kind: 'block',
          value: '@media only screen and (max-width:1319px) and (min--moz-device-pixel-ratio:1.5),only screen and (max-width:1319px) and (-moz-min-device-pixel-ratio:1.5)',
          body: [{
            kind: 'selector',
            value: [{ value: 'a' }],
            body: [{ value: 'color:#000' }]
          }],
          isFlatBlock: false
        }]
      ],
      'font-face': [
        '@font-face{font-family: fontName;font-size:12px}',
        [{
          kind: 'block',
          value: '@font-face',
          body: [
            { value: 'font-family:fontName' },
            { value: 'font-size:12px' }
          ],
          isFlatBlock: true
        }]
      ],
      'charset': [
        '@charset \'utf-8\';a{color:red}',
        [
          {
            kind: 'at-rule',
            value: '@charset \'utf-8\';'
          },
          {
            kind: 'selector',
            value: [{ value: 'a' }],
            body: [{ value: 'color:red' }]
          }
        ]
      ],
      'charset after a line break': [
        '\n@charset \n\'utf-8\';',
        [
          {
            kind: 'at-rule',
            value: '@charset \n\'utf-8\';'
          }
        ]
      ],
      'keyframes with quoted attribute': [
        '@keyframes __ESCAPED_FREE_TEXT_CLEAN_CSS0__{}',
        [{
          kind: 'block',
          value: '@keyframes __ESCAPED_FREE_TEXT_CLEAN_CSS0__',
          body: [],
          isFlatBlock: false
        }]
      ]
    })
  )
  .addBatch(
    tokenizerContext('broken', {
      'missing end brace': [
        'a{display:block',
        [{
          kind: 'selector',
          value: [{ value: 'a' }],
          body: []
        }]
      ],
      'missing end brace in the middle': [
        'body{color:red;a{color:blue;}',
        [{
          kind: 'selector',
          value: [{ value: 'body' }],
          body: [{ value: 'color:red' }]
        }]
      ]
    })
  )
  .addBatch(
    tokenizerContext('metadata', {
      'no content': [
        '',
        []
      ],
      'an escaped comment': [
        '__ESCAPED_COMMENT_CLEAN_CSS0__',
        []
      ],
      'an escaped special comment': [
        '__ESCAPED_COMMENT_SPECIAL_CLEAN_CSS0__',
        [{ kind: 'text', value: '__ESCAPED_COMMENT_SPECIAL_CLEAN_CSS0__' }]
      ],
      'an empty selector': [
        'a{}',
        [{
          kind: 'selector',
          value: [{ value: 'a' }],
          body: [],
          metadata: {
            body: '',
            bodiesList: [],
            selector: 'a',
            selectorsList: ['a']
          }
        }]
      ],
      'a double selector': [
        'a,\n\ndiv.class > p {color:red}',
        [{
          kind: 'selector',
          value: [{ value: 'a' }, { value: '\n\ndiv.class > p ' }],
          body: [{ value: 'color:red' }],
          metadata: {
            body: 'color:red',
            bodiesList: ['color:red'],
            selector: 'a,\n\ndiv.class > p ',
            selectorsList: ['a', '\n\ndiv.class > p ']
          }
        }]
      ],
      'two selectors': [
        'a{color:red}div{color:blue}',
        [
          {
            kind: 'selector',
            value: [{ value: 'a' }],
            body: [{ value: 'color:red' }],
            metadata: {
              body: 'color:red',
              bodiesList: ['color:red'],
              selector: 'a',
              selectorsList: ['a']
            }
          },
          {
            kind: 'selector',
            value: [{ value: 'div' }],
            body: [{ value: 'color:blue' }],
            metadata: {
              body: 'color:blue',
              bodiesList: ['color:blue'],
              selector: 'div',
              selectorsList: ['div']
            }
          }
        ]
      ],
      'two properties wrapped between comments': [
        'div{__ESCAPED_COMMENT_CLEAN_CSS0(0, 5)__color:red__ESCAPED_COMMENT_CLEAN_CSS1(0, 5)__}',
        [{
          kind: 'selector',
          value: [{ value: 'div' }],
          body: [
            { value: 'color:red' }
          ],
          metadata: {
            body: 'color:red',
            bodiesList: ['color:red'],
            selector: 'div',
            selectorsList: ['div']
          }
        }]
      ],
      'two properties wrapped between special comments': [
        'div{__ESCAPED_COMMENT_SPECIAL_CLEAN_CSS0(0, 5)__color:red__ESCAPED_COMMENT_SPECIAL_CLEAN_CSS1(0, 5)__}',
        [{
          kind: 'selector',
          value: [{ value: 'div' }],
          body: [
            { value: '__ESCAPED_COMMENT_SPECIAL_CLEAN_CSS0(0, 5)__' },
            { value: 'color:red' },
            { value: '__ESCAPED_COMMENT_SPECIAL_CLEAN_CSS1(0, 5)__' }
          ],
          metadata: {
            body: '__ESCAPED_COMMENT_SPECIAL_CLEAN_CSS0(0, 5)__,color:red,__ESCAPED_COMMENT_SPECIAL_CLEAN_CSS1(0, 5)__',
            bodiesList: ['__ESCAPED_COMMENT_SPECIAL_CLEAN_CSS0(0, 5)__', 'color:red', '__ESCAPED_COMMENT_SPECIAL_CLEAN_CSS1(0, 5)__'],
            selector: 'div',
            selectorsList: ['div']
          }
        }]
      ]
    }, true)
  )
  .export(module);
