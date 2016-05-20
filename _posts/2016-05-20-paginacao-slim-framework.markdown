---
layout: post
title:  "Welcome to Jekyll!"
date:   2016-05-11 19:21:13 -0300
categories: jekyll update
---

##Introdução##

A um certo tempo estava quabrando cabeça sobre como fazer uma paginação no Slim Framework em conjunto com o Illuminate database, dando uma vasculhada na internet, achei uma lib bem interessante do Jason Grimes — [PHP Paginator](https://github.com/jasongrimes/php-paginator).  Dando uma rápida lida, vi que seria fácil implementar, então sem mais delongas, vamos ao código! :D

Primeiramente precisamos definir o escopo do nosso `composer.json`, abaixo deixo o exemplo em que usei no meu projeto:

```
{
	"name": "Baixe Shows 2015",
	"description": "Baixe Shows 2015, Download de Músicas Grátis",
	"version": "1.0",

	"authors":[
		{
			"name": "Rai Siqueira",
			"email": "contato@raisiqueira.com"
		}
	],

	"require":{
		"slim/slim": "2.6.2",
		"zeuxisoo/slim-whoops": "0.3.0",
		"slim/views": "0.1.3",
		"twig/twig": "1.18.0",
		"illuminate/database": "5.0.4",
		"jasongrimes/paginator": "1.0.1",
    "respect/validation": "1.0.*@dev",
	},

	"autoload": {
		"psr-4":{
			"app\\Classes\\" : "app/Classes",
			"app\\Traits\\" : "app/Traits",
			"app\\Classes\\" : "app/Classes"
			},
        "classmap": [
            "app/Models"
        ]
    }
}
```
Ok, depois de incluirmos nossas dependências, rodamos nosso `composer install`, não vou entrar em detalhes de como instanciar o Slim, pois o intuito do tutorial não é esse, e sim dar um exemplo simples de como rodar uma paginação em nossa aplicação.

##Arquivo de Rota + Paginação##

Dentro do nosso arquivo de rota, precisamos chamar a dependência da paginação com um simples `use` fazemos a chamada do plugin:
`use JasonGrimes\Paginator;`

Feito isso, agora vamos criar nossa rota onde queremos atribuir paginação, em meu código usei como referência, uma página de artistas, listando uma quantidade "X" de shows disponíveis de tal artista.

```
$app->get('/artista/:slug/(:page/)', function($slug, $page = 1) use($app, $capsule, $ajustes){
	// seleciona o artista pelo slug
	$artista = Artistas::where('art_slug', '=', $slug)->firstOrFail();
    // Retorna o numero de posts do artista
    $total_posts = Shows::showsArtista($artista->art_id)->count();
    // Retorna o numero de páginas para fazer a paginação
    $pages = ceil($total_posts / $ajustes->artista_por_pag);
    // Se deu tudo certo até agora, a aplicação continua
    if($page > $pages) $app->pass();
    // Slug do artista
	$slugArt = $artista->art_slug;
	// Paginação Eloquent ORM + Slim
	$shows_do_artista = $capsule->table('shows')->where('show_artista', '=', $artista->art_id)->orderBy('show_criado_em','desc')->skip($ajustes->artista_por_pag * ($page - 1))->take($ajustes->artista_por_pag)->get();
	//Paginator Jason Grimes - https://github.com/jasongrimes/php-paginator
	$total = $total_posts;
	$urlPat = $app->request()->getUrl() . DS . 'artista' . DS . $slugArt . DS . "(:num)/";
	if(!$page){
		$page = 1;
	}
	$paginator = new Paginator($total, $ajustes->artista_por_pag, $page, $urlPat);
	$get = $paginator->getTotalItems();
	$total_pagina = $paginator->getItemsPerPage();
	try{
		if($page >= 2 && $total_pagina != $ajustes->artista_por_pag ){
			$app->pass();
		}
	}catch(Exception $e){
		$app->notFound();
	}
	$infos = array(
		'artista' 			=> $artista,
		'site_titulo' 		=> $artista->art_nome,
		'site_descricao' 	=> $ajustes->titulo . " | " . $ajustes->descricao,
		'site_url'			=> $ajustes->site_url,
        'artista_url'       => $ajustes->site_url."/artista" . DS .$artista->art_slug,
		'shows'				=> $shows_do_artista,
		'show_url'			=> $ajustes->site_url . DS . "show",
		'paginator'			=> $paginator
	);
	$app->render('artista.html', $infos);
})->conditions(array('page' => '\d+'));
```
PS.: As variáveis `$capsule` e `$ajustes` se referem a funções do meu código, onde `$capsule` instancia o Eloquent, e a variável `$ajustes` retorna valores de uma tabela do meu banco, onde defino alguns ajustes do site (como tema que usei, quantidade de posts por página e etc.).

Na **linha 11** do código passamos o parâmetro `:page` como opcional, pois ele é quem retornará a página atual do site.

A **linha 13** selecionamos o artista no banco a partir do slug passado na url, exemplo: `site.com/coldplay/`. Nossa aplicação vai buscar no banco o artista informado na url.

Seguindo com o código, fazemos uma contagem na **linha 16** de quantos shows existem para tal artista em nossa base. Para que em seguida possamos exibir na nossa aplicação.

Da **linha 19** à **linha 22**, fazemos uma verificação da quantidade de páginas a serem exibidas, e se o atributo da página passado na url é maior do que o retorno da quantidade da páginas, se for maior, nossa aplicação continua.

##Começando o Show!##

Se você já for familiarizado com o Eloquent, vai entender fácil o código seguinte, onde faço uma consulta na tabela shows, pesquisando pelo ID do artista e ordenando por ordem crescente. Linhas 24 à 27.
`
$slugArt = $artista->art_slug;
	// Paginação Eloquent ORM + Slim
	$shows_do_artista = $capsule->table('shows')->where('show_artista', '=', $artista->art_id)->orderBy('show_criado_em','desc')->skip($ajustes->artista_por_pag * ($page - 1))->take($ajustes->artista_por_pag)->get();`

Seguindo, se der uma rápida olhada na documentação do Jason Grimer, verá como a implementação é simples, com o slim Vai ficar mais ou menos assim (linhas 29 à 44):

```

$slugArt = $artista->art_slug;
	// Paginação Eloquent ORM + Slim
	$shows_do_artista = $capsule->table('shows')->where('show_artista', '=', $artista->art_id)->orderBy('show_criado_em','desc')->skip($ajustes->artista_por_pag * ($page - 1))->take($ajustes->artista_por_pag)->get();

```

Feito isso, nossa paginação já está praticamente pronta, basta passar a variável `$paginator` em um array e aplicar no `$app->render('sua_pagina.php, $array);`.

O código completo está no meu [gist](https://gist.github.com/raisiqueira/ccb0b3ad9a82e14a2eb5d6c5f03d27a3) pra quem quiser dar uma olhada. O tutorial foi bem simples e creio que já dá pra dar aquela luz em nossa mente. É isso, caso tenha mais alguma sugestão de como implementar uma paginação no Slim, ou qualquer outra coisa bacana que você achou, deixem sugestões.

Abraços!
