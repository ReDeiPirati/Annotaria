<?php

# questo script inserisce nel triple store 2 o 3 triple, in base ai parametri:
# - $POST["endpoint"] contiene l'URL del server fuseki in cui inserire le triple
# - $POST["sog"], $POST["pre"] e $POST["ogg"] contengono i 3 elementi del primo statement
# - $POST["pre2"] e $POST["ogg2"] contengono predicato e oggetto del secondo statement, come soggetto viene usato sempre $POST["sog"]
# - $POST["ogg3"] contiene l'oggetto per il terzo statement (solo per le citazioni)
# lo script restituisce  un dizionario con due chiavi, se viene eseguito con successo alla chiave "success" corrisponde il valore "true", altrimenti "false"  , più valori di debug nell'array message



	
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

	if ( $_POST["ogg3"] != "" )
	{
		$uriogg3 = new EasyRdf_Resource($_POST["ogg3"]);	
		$graph -> add( $urisog , $uripre ,  $uriogg3  );

		$uriogg2 = new EasyRdf_Resource($_POST["ogg2"]);
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
	


