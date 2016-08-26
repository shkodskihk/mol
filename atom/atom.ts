enum $mol_atom_status {
	obsolete = 'obsolete' as any ,
	checking = 'checking' as any ,
	actual = 'actual' as any ,
} 

class $mol_atom< Value > extends $mol_object {

	masters : $mol_set< $mol_atom<any> > = null
	slaves : Array< $mol_atom<any> > = null

	status = $mol_atom_status.obsolete

	host : { objectPath() : string } = this

	constructor(
		host : { objectPath() : string } ,
		public field = 'value()' ,
		public handler : ( ...diff : (Value|Error)[] )=> Value ,
		public fail? : ( host : any , error : Error )=> Value|Error ,
		public key? : any
	) {
		super()
		
		this.host = host || this
	}
	
	static make( handler , fail? , key? ) {
		var atom = new $mol_atom( null , null , handler , fail , key )
		var accessor = ( ...diff )=> atom.value( ...diff )
		accessor['atom'] = atom
		return accessor
	}
	
	destroyed( ...diff : boolean[] ) {
		if( diff[0] ) {
			this.unlink()
			
			var value = this.host[ this.field ]
			if( value instanceof $mol_object ) {
				if( ( value.objectOwner() === this.host ) && ( value.objectField() === this.field ) ) {
					value.destroyed( true );
				}
			}
			
			this.host[ this.field ] = void 0
			this.host[ '$mol_atom_state' ][ this.field ] = void 0
			
			this['destroyed()'] = true
			this.log([ '.destroyed()' , true , 'atom' ])
			
			return true
		} else {
			return this['destroyed()']
		}
	}
	
	unlink() {
		this.disobeyAll()
		this.checkSlaves()
	}
	
	objectPath() {
		return this.host.objectPath() + '.' + this.field
	}
	
	get() {
		if( $mol_atom.stack.indexOf( this ) !== -1 ) {
			throw new Error( 'Recursive dependency! ' + this.objectPath() )
		}
		
		var slave = $mol_atom.stack[ $mol_atom.stack.length - 1 ]
		if( slave ) this.lead( slave )
		if( slave ) slave.obey( this )
		
		this.actualize()
		
		var value : Value|Error = this.host[ this.field ]
		
		if( value instanceof Error ) throw value
		return value
	}
	
	actualize() {
		if( this.status === $mol_atom_status.actual ) return false

		if( this.status === $mol_atom_status.checking ) {
			this.masters.forEach( master => {
				if( this.status !== $mol_atom_status.checking ) return
				master.actualize()
			} )
			if( this.status === $mol_atom_status.checking ) {
				this.status = $mol_atom_status.actual
				return false
			} 
		}
		
		var value = this.host[ this.field ]
		return this.pull() !== value
	}
	
	pull() {
		this.log([ 'pull' ])
		
		var oldMasters = this.masters
		
		if( oldMasters ) oldMasters.forEach( master => {
			//if( this.masters && this.masters.has( master ) ) return
			master.dislead( this )
		} )
		
		this.masters = null
		
		var index = $mol_atom.stack.length
		$mol_atom.stack.push( this )
		if( this.key !== void 0 ) {
			var next = this.handler.call( this.host , this.key )
		} else {
			var next = this.handler.call( this.host )
		}
		if( next === void 0 ) next = this.host[ this.field ]
		$mol_atom.stack.length = index
		
		return this.push( next )
	}
	
	set( ...diff : (Value|Error)[] ) {
		if( this.key !== void 0 ) {
			var next = this.handler.call( this.host , this.key , ...diff )
		} else {
			var next = this.handler.call( this.host , ...diff )
		}
		if( next === void 0 ) return this.host[ this.field ]
		return this.push( next )
	}
	
	push( next : Value|Error ) {
		var prev = this.host[ this.field ]
		if( next instanceof Error && this.fail ) {
			if( this.key !== void 0 ) {
				next = this.fail.call( this.host , this.key , this.host , <Error> next )
			} else {
				next = this.fail.call( this.host , this.host , <Error> next )
			}
		}
		if( prev !== next ) {
			if( next instanceof $mol_object ) {
				next['objectField']( this.field ) // FIXME: type checking
				next['objectOwner']( this.host ) // FIXME: type checking
			}
			this.host[ this.field ] = next
			this.log([ 'push' , next , prev ])
			this.obsoleteSlaves()
		}
		this.status = $mol_atom_status.actual
		return next
	}

	obsoleteSlaves( ) {
		if( !this.slaves ) return

		this.slaves.forEach(slave => {
			// if ($mol_atom.stack[$mol_atom.stack.length - 1] === slave) return
			slave.obsolete()
		})
	}

	checkSlaves( ) {
		if( this.slaves ) {
			this.slaves.forEach(slave => {
				// if ($mol_atom.stack[$mol_atom.stack.length - 1] === slave) return
				slave.check()
			})
		} else {
			$mol_atom.actualize( this )
		}
	}
	
	check() {
		if( this.status === $mol_atom_status.actual ) {
			this.status = $mol_atom_status.checking

			this.checkSlaves()
		}
	}
	
	obsolete() {
		if( this.status === $mol_atom_status.obsolete ) return
		
		this.log([ 'obsolete' ])

		this.status = $mol_atom_status.obsolete

		this.checkSlaves()
		
		return void 0
	}
	
	lead( slave : $mol_atom<any> ) {
		if( !this.slaves ) this.slaves = []
		if( this.slaves.indexOf( slave ) !== -1 ) return
		this.slaves.push( slave )
	}
	
	dislead( slave : $mol_atom<any> ){
		if( !this.slaves ) return
		
		var index = this.slaves.indexOf( slave )
		if( index !== -1 ) this.slaves.splice( index , 1 )
		
		if( !this.slaves.length ){
			this.slaves = null
			$mol_atom.reaping.add( this )
		}
	}
	
	obey( master : $mol_atom<any> ) {
		if( !this.masters ) this.masters = new $mol_set< $mol_atom<any> >()
		this.masters.add( master )
	}
	
	disobey( master : $mol_atom<any> ){
		if( !this.masters ) return
		this.masters.delete( master )
	}
	
	disobeyAll( ) {
		if( !this.masters ) return
		
		this.masters.forEach( master => master.dislead( this ) )
		
		this.masters = null
	}
	
	value( ...diff : (Value|Error)[] ) {
		if( diff[0] === void 0 ) {
			if( diff.length > 1 ) return this.push( diff[1] )
			if( diff.length > 0 ) return this.obsolete()
			return this.get()
		} else {
			return this.set( ...diff )
		}
	}
	
	static stack = [] as $mol_atom<any>[]
	static updating : $mol_atom<any>[] = []
	static reaping = new $mol_set< $mol_atom<any> >()
	static scheduled = false
	
	static actualize( atom : $mol_atom<any> ) {
		$mol_atom.updating.push( atom )
		$mol_atom.schedule()
	}
	
	static schedule( ) {
		if( this.scheduled ) return
		
		new $mol_defer( () => {
			if( !this.scheduled ) return
			this.scheduled = false
			this.sync()
		} )
		
		this.scheduled = true
	}
	
	static sync() {
		$mol_log( '$mol_atom.sync' , [] )
		this.schedule()
		
		while( this.updating.length ) {
			var atom = this.updating.shift()
			if( !atom.destroyed() ) atom.actualize()
		}
		
		while( this.reaping.size ) {
			this.reaping.forEach(atom => {
				this.reaping.delete(atom)
				if (!atom.slaves) atom.destroyed(true)
			})
		}
		
		this.scheduled = false
	}
	
	static restore() {
		this.stack.splice( 0 , this.stack.length )
	}
}

$mol_state_stack.set( '$mol_atom.stack' , $mol_atom.stack )

class $mol_atom_wait extends Error {
	name = '$mol_atom_wait'
	constructor( public message = 'Wait...' ) {
		super( message )
	}
}
