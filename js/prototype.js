/*
*		nonAnnAncestor
*
*		restituisce la posizione di un nodo all'interno di una lista
*/
	NodeList.prototype.indexOf = function(n) { 
		var i=0; 
		while (this.item(i) !== n) {i++;}
		return i ;
	};

/*
*		nonAnnAncestor
*
*		restituisce il primo nodo antenato che non e' uno span di una annotazione
*/
Node.prototype.nonAnnAncestor = function () {
	var id, anc = this;
	do {
		anc.son = anc
		anc = anc.parentNode;
		id = anc.id;
	} while (id.indexOf("span-ann") != -1);
	return anc;
};
	
/*
*		descendantTextNodes
*
*		aggiunge in coda al vettore passato per parametro tutti i nodi di testo discendenti dal nodo di testo da cui si invoca la funzione
*/
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
*		funzione che restituisce true se il chiamante e' discendente nodo passato per parametro, false altrimenti
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

