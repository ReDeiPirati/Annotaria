<?php

# questo script inserisce nel triple store 2 o 3 triple, in base ai parametri:
# - "endpoint" e' l'URL del server fuseki in cui inserire le triple
# - "sog", "pre" e "ogg" sono i 3 elementi del primo statement
# - "pre2" e "ogg2" sono predicato e oggetto del secondo statement, come soggetto viene usato sempre "sog"
# - "ogg3" indica l'oggetto per il terzo statement, usato solo per le annotazioni di tipo citazione e puo' quindi non essere passato
# lo script restituisce sempre un dizionario con due chiavi, se viene eseguito con successo alla chiave "success" corrisponde il valore "true", altrimenti "false"



	
	require 'vendor/autoload.php';

	
	$message = array();	

	//the body response
        $data = array(

            "success"  => "true",
            "message"  => $message 
            
        );

try
{

	

	$graph = new EasyRdf_Graph();	//creiamo un nuovo grafo


	array_push( $data['message'] , $_POST );


	$urisog = new EasyRdf_Resource( $_POST["sog"] );
	$uripre = new EasyRdf_Resource( $_POST["pre"] );
	$uripre2 = new EasyRdf_Resource( $_POST["pre2"] );
	$uriogg = new EasyRdf_Resource( $_POST["ogg"] );

	$graph -> add( $urisog , $uripre ,  $uriogg );

	if ( array_key_exists( "ogg3" , $_POST ) )
	{
		$uriogg3 = new EasyRdf_ParsedUri($_POST["ogg3"]);	
		$graph -> add( $urisog , $uripre ,  $uriogg3  );

		$uriogg2 = new EasyRdf_ParsedUri($_POST["ogg2"]);
		$graph -> add( $urisog , $uripre2 ,  $uriogg2  );	
	}
	else
	{
		$litogg2 = new EasyRdf_Literal($_POST["ogg2"]);
		$graph -> add( $urisog , $uripre2 ,  $litogg2  );	
	}
 

	//load the graph in the triplestore

	$triplestore_url = $_POST["endpoint"];

	array_push( $data['message'] , $triplestore_url  ); 

	$spqcli = new EasyRdf_Sparql_Client( $triplestore_url . "/query" , $triplestore_url . "/update" );

	$insert = $graph -> serialise( "ntriples" );

	$toinsert = sprintf( "INSERT DATA { %s }" , $insert );

	$spqcli -> update( $toinsert );

	array_push( $data['message'] , $toinsert  ); 
	array_push( $data['message'] , "!!!updated!!!"  ); 
	array_push( $data['message'] , "hai inserito correttamente le annotazioni"  ); 

}


catch( Exception $e )
{
	$data["success"] = "false";
	array_push( $data['message'] ,  $e -> getMessage() ); 
}

	//response as a json
	header('Content-type: application/json');

        echo json_encode($data);

	
	
?>
	


