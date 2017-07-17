namespace $ {
	
	export function $mol_dom_render_fields (
		el : Element ,
		fields : { [ key : string ] : any }
	) {
		for( let key in fields ) {
			
			const val : any = fields[ key ]
			
			if( val === undefined ) continue
			if( el[ key ] === val ) continue
			
			el[ key ] = val
			if( el[ key ] === val ) continue
			
			const setter = ()=> {
				el.removeEventListener( 'DOMNodeInsertedIntoDocument' , setter , { passive : true } as any )
				new $mol_defer( ()=> {
					el[ key ] = val
				} )
			}
			el.addEventListener( 'DOMNodeInsertedIntoDocument' , setter , { passive : true } as any )
			
		}
	}
	
	export function $mol_dom_render_children (
		el : Element ,
		childNodes : NodeList | Array< Node | string | number | boolean | { render : ()=> Node } >
	) {
		const nodes = [] as ( Node | string )[]
		
		for( let i = 0 ; i < childNodes.length ; ++i ) {
			let node = childNodes[ i ] as any
			if( node == null ) continue
			if( Object( node ) === node ) {
				if( node[ 'render' ] ) node = node[ 'dom_node' ]()
				nodes.push( node )
			} else {
				nodes.push( String( node ) )
			}
		}
		
		let nextNode = el.firstChild
		for( let view_ of nodes ) {
			const view = view_.valueOf() as Node
			
			if( view instanceof $mol_dom_context.Node ) {
				
				while( true ) {
					if( !nextNode ) {
						el.appendChild( view )
						break
					}
					if( nextNode == view ) {
						nextNode = nextNode.nextSibling
						break
					} else {
						if( nodes.indexOf( nextNode ) === -1 ) {
							const nn = nextNode.nextSibling
							el.removeChild( nextNode )
							nextNode = nn
						} else {
							el.insertBefore( view , nextNode )
							break
						}
					}
				}
				
			} else {
				if( nextNode && nextNode.nodeName === '#text' ) {
					nextNode.nodeValue = String( view )
					nextNode = nextNode.nextSibling
				} else {
					const textNode = $mol_dom_context.document.createTextNode( String( view ) )
					el.insertBefore( textNode , nextNode )
				}
			}
			
		}
		
		while( nextNode ) {
			const currNode = nextNode
			nextNode = currNode.nextSibling
			el.removeChild( currNode )
		}

		for( let i = 0 ; i < childNodes.length ; ++i ) {
			let node = childNodes[ i ] as any
			if( node == null ) continue
			if( Object( node ) === node ) {
				if( node[ 'render' ] ) node = node[ 'render' ]()
			}
		}
	}
	
	export function $mol_dom_render_attributes (
		el : Element ,
		attrs : { [ key : string ] : string|number|boolean }
	) {
		for( let name in attrs ) {
			let val = attrs[ name ] as any
			if( el.getAttribute( name ) === val ) continue
			if( val === null || val === false ) el.removeAttribute( name )
			else el.setAttribute( name , String( val ) )
		}
	}
	
	export function $mol_dom_render_styles (
		el : Element ,
		styles : { [ key : string ] : string|number }
	) {
		for( let name in styles ) {
			let val = styles[ name ]
			
			const style = ( <HTMLElement>el ).style as any
			const cur = style[ name ]
			
			if( typeof val === 'number' ) {
				if( parseFloat( cur ) == val ) continue
				style[ name ] = `${ val }px`
			}
			
			if( cur !== val ) style[ name ] = val
		}
	}
	
	export function $mol_dom_render_events (
		el : Element ,
		events : { [ key : string ] : ( event : Event )=> any }
	) {
		for( let name in events ) {
			el.addEventListener( name , events[ name ] )
		}
	}
	
	export function $mol_dom_render_events_async (
		el : Element ,
		events : { [ key : string ] : ( event : Event )=> any }
	) {
		for( let name in events ) {
			el.addEventListener( name , events[ name ] , { passive : true } as any )
		}
	}
	
}
