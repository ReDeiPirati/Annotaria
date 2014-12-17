/*
*	Remote server to call
*/

var serverFuseki = "http://giovanna.cs.unibo.it:8181/data/query";
var serverDbpedia = "http://dbpedia.org/sparql";
/*
*	Dizionario contenente gli URI relativi alla parte di semantic web
*/

prefixUri = { 
		foaf: "http://xmlns.com/foaf/0.1/", 
		fabio: "http://purl.org/spar/fabio/", 
		ao: "http://vitali.web.cs.unibo.it/AnnOtaria/", 
		aop: "http://vitali.web.cs.unibo.it/AnnOtaria/person/", 
		dcterms: "http://purl.org/dc/terms/", 
		rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#", 
		rdfs: "http://www.w3.org/2000/01/rdf-schema#", 
		oa: "http://www.w3.org/ns/oa#",
		schema: "http://schema.org/",
		dbpedia: "http://dbpedia.org/ontology/", 
		skos: "http://www.w3.org/2004/02/skos/core#",
		sem: "http://www.ontologydesignpatterns.org/cp/owl/semiotics.owl#", 
		cito: "http://purl.org/spar/cito/",
 		xs: "http://www.w3.org/2001/XMLSchema#",
		mod: "http://modalnodes.cs.unibo.it/annotaria/"
};

/*
*	variabile contenente tutti i prefissi, usata per le query
*/

var PREFIXES = """
	prefix foaf: <"""+prefixUri['foaf']+"""> 
	prefix fabio: <"""+prefixUri['fabio']+"""> 
	prefix ao: <"""+prefixUri['ao']+"""> 
	prefix aop: <"""+prefixUri['aop']+"""> 
	prefix dcterms: <"""+prefixUri['dcterms']+"""> 
	PREFIX rdf: <"""+prefixUri['rdf']+"""> 
	PREFIX rdfs: <"""+prefixUri['rdfs']+""">
	prefix oa: <"""+prefixUri['oa']+"""> 
	prefix schema: <"""+prefixUri['schema']+"""> 
	prefix dbpedia: <"""+prefixUri['dbpedia']+"""> 
	prefix skos: <"""+prefixUri['skos']+"""> 
	prefix sem: <"""+prefixUri['sem']+"""> 
	prefix cito: <"""+prefixUri['cito']+"""> 
	prefix xs: <"""+prefixUri['xs']+"""> 
	prefix frbr: <"""+prefixUri['frbr']+"""> 
	prefix mod: <"""+prefixUri['mod']+""">
""";


var query = function( queryttl , success , error , timeout ,   )
{
	
};
