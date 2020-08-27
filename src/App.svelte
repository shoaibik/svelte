<script>
	export let citation = '671 F.3d 1113 (9th Cir, 2012)';
	export let text = 'The Plaintiffs/Appellants are the elected Chairman and Vice Chairman of Sardauna Local Government Council of Taraba State who were elected for a tenure of three years from the date they were sworn in into office. The 1st to 12th Defendants/Respondents (the Councilors of the Local Government) served the Appellants with a suspension letter dated 27/072017 for a period of three months. After the expiration of the three months suspension, the Governor of Taraba State extended the suspension for an indefinite term by a letter. By an Originating Summons, the Appellants sought for the following declarations against the Respondents, among others: an order of this court declaring the act of 1st to 15th Defendants in purporting to suspend the Plaintiffs and thereafter proceed to investigate them as unconstitutional, illegal, null and void abinitio; an order of this court vacating the 11th Defendant from office as acting Chairman of Sardauna Local Government Council; an order of this court declaring the extension of the suspension of the Plaintiffs by the Defendants from their elected offices as unconstitutional, illegal, null and void. The lower Court heard and dismissed the case of the Appellants. Dissatisfied, the Appellants lodged an appeal before this court contending that Section 34 and 36 of the Taraba State Local Government Law, 2000 does not confer powers on a legislative council to suspend an elected Chairman and Vice Chairman.';
	export let p = { x: 0, y: 0 };
	let selectedText = '';

	window.addEventListener('click', function(e){   
		if (!document.getElementById('text').contains(e.target)){
			p = {
				x: 0,
				y:0
			}
		}
	});
	
	function copyCitation (text) {
		var dummy = document.createElement("textarea");
		document.body.appendChild(dummy);
		
		dummy.value = text;
		dummy.select();
		document.execCommand("copy");
		document.body.removeChild(dummy);

		alert('Copied');
	}

	function copyWithCitation(e){
		e.preventDefault();
		e.stopPropagation();
		let text = citation + ' ' +selectedText;
		copyCitation(text);
	}

	function onSelection(e){
		
		let selection = window.getSelection();
		selectedText = selection.toString();	
		if(!window.getSelection().isCollapsed) {
			var sel = window.getSelection();
			var range = document.createRange();
			range.setStart(sel.anchorNode, sel.anchorOffset);
			range.setEnd(sel.focusNode, sel.focusOffset);
			var backwards = range.collapsed;
			range.detach();
			
			var rects = sel.getRangeAt(0).getClientRects();
			var n = rects.length - 1;
			

			p.y = rects[n].top + 10, 
			p.x = rects[n].right;

			document.getElementById("menu").style.top = p.y;
			document.getElementById("menu").style.left = p.x;
		}else{
			p = {
				x: 0,
				y:0
			}
		}
	}

	function highlightSelection() {
		text = text.replace(/<[^>]*>?/gm, '');
		text = text.replace(selectedText, '<span class="bg-yellow-400 text-black">'+selectedText+'</span>');
	}
</script>

<style>
	#menu li ul{
		left:100%;
	}
	#menu li:hover ul{
		display:block;
	}
</style>

<main>
	<p class="text-xs mb-2">
		<span>Nigeria Court of Appeals, Ninth Circuit.</span>
		<span class="ml-5">February 7th 2016</span>
		<span class="ml-5">629 F.3d 450 (5th Cir, 2010) Cited 107 times</span>
	</p>

	<p class="text-sm mb-3">
		<span class="bg-gray-300 py-2 px-1 rounded inline-block">Motion to dismiss</span>	
		<span class="bg-gray-300 py-2 px-1 rounded mx-2 inline-block">IP - Copyright</span>	
		<span class="bg-gray-300 py-2 px-1 rounded mx-2 inline-block">IP - Patent</span>	
		<span class="bg-gray-300 py-2 px-1 rounded mx-2 inline-block">Consumer - Antitrust</span>	
	</p>

	<p class="text-sm mb-3">
		<span class="bg-gray-300 py-2 px-1 rounded pr-8 inline-block">{citation}</span>	
		<button class="bg-blue-700 text-white py-2 px-4 rounded mx-2 -ml-4 " on:click="{copyCitation(citation)}">Copy Citation</button>	
	</p>

	<p class="text-blue-700 font-bold mb-4">
		Chidi N.Uwa, James S. Abiriyi, Abdullahi M, Bayero
	</p>


	<h1 class="mt-4 mb-4 text-2xl font-bold">Hon. Christopher D. Sameul, Hon John B. Yep Anor <br>2012-02-7</h1>	

	<h2 class="mb-3 text-1xl font-bold">Case Summery</h2>

	<p id="text" on:click="{onSelection}">{@html text}</p>

	<ul id="menu" class="bg-gray-300 rounded inline-block text-sm border border-gray-400 cursor-pointer absolute" class:hidden="{p.y === 0}" style="top: {p.y}px; left: {p.x}px">
		<li class="border-b border-gray-500 py-3 px-3 hover:text-blue-700" on:click="{copyWithCitation}"><i class="material-icons text-base mr-1 align-middle" >content_copy</i> Copy with Citation</li>
		<li class="border-b border-gray-500  py-3 px-3 hover:text-blue-700" on:click="{highlightSelection}"><i class="material-icons text-base text-yellow-500 mr-1 align-middle">edit</i> Highlight</li>
		<li class=" py-3 px-3 relative hover:text-blue-700 group"><i class="material-icons text-base mr-1 align-middle">folder</i> Add to Brief <i class="material-icons float-right align-middle">chevron_right</i>
			<ul class="hidden absolute bg-gray-300 w-40 top-0 text-gray-800 border border-gray-400 group-hover:block group-hover:text-white" >
				<li class="border-b border-gray-500 py-3 px-3 hover:text-blue-700 group-hover:text-white">Test Brief</li>
				<li class="border-b border-gray-500 py-3 px-3 hover:text-blue-700">Main Case 2020</li>
				<li class="py-3 px-3 hover:text-blue-700">Case Research Brief</li>
			</ul>
		</li>
	</ul>

</main>