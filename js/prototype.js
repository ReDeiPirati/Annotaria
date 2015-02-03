
//funzione che restituisce la posizione di un nodo in una lista di nodi
	NodeList.prototype.indexOf = function(n) { 
		var i=0; 
		while (this.item(i) !== n) {i++;}
		return i ;
	};
	
	//funzione che restituisce il primo nodo antenato che non sia uno span di annotazione
	Node.prototype.nonAnnAncestor = function () {
		var id, anc = this;
		do {
			anc.son = anc
			anc = anc.parentNode;
			id = anc.id;
		} while (id.indexOf("span-ann") != -1);
		return anc;
	};
	
	//funzione che appende al vettore passato come parametro tutti i nodi di testo discendenti del nodo tramite cui si invoca la funzione, in ordine da sinistra a destra
	Node.prototype.descendantTextNodes = function(vet) { 
		for (var i=0; i<this.childNodes.length; i++)
			if (this.childNodes[i].nodeType == 3)
				vet.push(this.childNodes[i]);
			else
				this.childNodes[i].descendantTextNodes(vet);
		return vet.length;
	};
	

/*
*		isDescendantOf
*
*		funzione che restituisce true se il chiamante e' discendente del parametro, false altrimenti
*/
Node.prototype.isDescendantOf = function(padre) {
	
	var tmp = this.parentNode;
	
	while (tmp) {
		if (tmp == padre)
			return true;
		else
			tmp=tmp.parentNode;
	}
	return false;
}

