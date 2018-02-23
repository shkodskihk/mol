"use strict"
/// Fake namespace for optional overrides
///
/// 	namespace $ { export var x = 1 , y = 1 } // defaults
/// 	namespace $.$$ { export var x = 2 } // overrides
/// 	namespace $.$$ { console.log( x , y ) } // usage
///
this.$ = this.$ || this
var $ = this.$
$.$$ = $

$.$mol = $  // deprecated

;

void function( module ) { var exports = module.exports; function require( id ) { return $node[ id ] }; 

;
"use strict";
var $;
(function ($_1) {
    let $;
})($ || ($ = {}));
module.exports = $;
//mol.js.map
;

$node[ "../mol/mol.js" ] = $node[ "../mol/mol.js" ] = module.exports }( { exports : {} } )

//# sourceMappingURL=web.js.map