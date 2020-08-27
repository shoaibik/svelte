
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.24.1' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/App.svelte generated by Svelte v3.24.1 */

    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let p0;
    	let span0;
    	let t1;
    	let span1;
    	let t3;
    	let span2;
    	let t5;
    	let p1;
    	let span3;
    	let t7;
    	let span4;
    	let t9;
    	let span5;
    	let t11;
    	let span6;
    	let t13;
    	let p2;
    	let span7;
    	let t14;
    	let t15;
    	let button;
    	let t17;
    	let p3;
    	let t19;
    	let h1;
    	let t20;
    	let br;
    	let t21;
    	let t22;
    	let h2;
    	let t24;
    	let p4;
    	let t25;
    	let ul1;
    	let li0;
    	let i0;
    	let t27;
    	let t28;
    	let li1;
    	let i1;
    	let t30;
    	let t31;
    	let li5;
    	let i2;
    	let t33;
    	let i3;
    	let t35;
    	let ul0;
    	let li2;
    	let t37;
    	let li3;
    	let t39;
    	let li4;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			main = element("main");
    			p0 = element("p");
    			span0 = element("span");
    			span0.textContent = "Nigeria Court of Appeals, Ninth Circuit.";
    			t1 = space();
    			span1 = element("span");
    			span1.textContent = "February 7th 2016";
    			t3 = space();
    			span2 = element("span");
    			span2.textContent = "629 F.3d 450 (5th Cir, 2010) Cited 107 times";
    			t5 = space();
    			p1 = element("p");
    			span3 = element("span");
    			span3.textContent = "Motion to dismiss";
    			t7 = space();
    			span4 = element("span");
    			span4.textContent = "IP - Copyright";
    			t9 = space();
    			span5 = element("span");
    			span5.textContent = "IP - Patent";
    			t11 = space();
    			span6 = element("span");
    			span6.textContent = "Consumer - Antitrust";
    			t13 = space();
    			p2 = element("p");
    			span7 = element("span");
    			t14 = text(/*citation*/ ctx[2]);
    			t15 = space();
    			button = element("button");
    			button.textContent = "Copy Citation";
    			t17 = space();
    			p3 = element("p");
    			p3.textContent = "Chidi N.Uwa, James S. Abiriyi, Abdullahi M, Bayero";
    			t19 = space();
    			h1 = element("h1");
    			t20 = text("Hon. Christopher D. Sameul, Hon John B. Yep Anor ");
    			br = element("br");
    			t21 = text("2012-02-7");
    			t22 = space();
    			h2 = element("h2");
    			h2.textContent = "Case Summery";
    			t24 = space();
    			p4 = element("p");
    			t25 = space();
    			ul1 = element("ul");
    			li0 = element("li");
    			i0 = element("i");
    			i0.textContent = "content_copy";
    			t27 = text(" Copy with Citation");
    			t28 = space();
    			li1 = element("li");
    			i1 = element("i");
    			i1.textContent = "edit";
    			t30 = text(" Highlight");
    			t31 = space();
    			li5 = element("li");
    			i2 = element("i");
    			i2.textContent = "folder";
    			t33 = text(" Add to Brief ");
    			i3 = element("i");
    			i3.textContent = "chevron_right";
    			t35 = space();
    			ul0 = element("ul");
    			li2 = element("li");
    			li2.textContent = "Test Brief";
    			t37 = space();
    			li3 = element("li");
    			li3.textContent = "Main Case 2020";
    			t39 = space();
    			li4 = element("li");
    			li4.textContent = "Case Research Brief";
    			add_location(span0, file, 80, 2, 3143);
    			attr_dev(span1, "class", "ml-5");
    			add_location(span1, file, 81, 2, 3199);
    			attr_dev(span2, "class", "ml-5");
    			add_location(span2, file, 82, 2, 3245);
    			attr_dev(p0, "class", "text-xs mb-2");
    			add_location(p0, file, 79, 1, 3116);
    			attr_dev(span3, "class", "bg-gray-300 py-2 px-1 rounded inline-block");
    			add_location(span3, file, 86, 2, 3351);
    			attr_dev(span4, "class", "bg-gray-300 py-2 px-1 rounded mx-2 inline-block");
    			add_location(span4, file, 87, 2, 3436);
    			attr_dev(span5, "class", "bg-gray-300 py-2 px-1 rounded mx-2 inline-block");
    			add_location(span5, file, 88, 2, 3523);
    			attr_dev(span6, "class", "bg-gray-300 py-2 px-1 rounded mx-2 inline-block");
    			add_location(span6, file, 89, 2, 3607);
    			attr_dev(p1, "class", "text-sm mb-3");
    			add_location(p1, file, 85, 1, 3324);
    			attr_dev(span7, "class", "bg-gray-300 py-2 px-1 rounded pr-8 inline-block");
    			add_location(span7, file, 93, 2, 3733);
    			attr_dev(button, "class", "bg-blue-700 text-white py-2 px-4 rounded mx-2 -ml-4 ");
    			add_location(button, file, 94, 2, 3816);
    			attr_dev(p2, "class", "text-sm mb-3");
    			add_location(p2, file, 92, 1, 3706);
    			attr_dev(p3, "class", "text-blue-700 font-bold mb-4");
    			add_location(p3, file, 97, 1, 3953);
    			add_location(br, file, 102, 91, 4146);
    			attr_dev(h1, "class", "mt-4 mb-4 text-2xl font-bold");
    			add_location(h1, file, 102, 1, 4056);
    			attr_dev(h2, "class", "mb-3 text-1xl font-bold");
    			add_location(h2, file, 104, 1, 4168);
    			attr_dev(p4, "id", "text");
    			add_location(p4, file, 106, 1, 4224);
    			attr_dev(i0, "class", "material-icons text-base mr-1 align-middle");
    			add_location(i0, file, 109, 99, 4554);
    			attr_dev(li0, "class", "border-b border-gray-500 py-3 px-3 hover:text-blue-700");
    			add_location(li0, file, 109, 2, 4457);
    			attr_dev(i1, "class", "material-icons text-base text-yellow-500 mr-1 align-middle");
    			add_location(i1, file, 110, 102, 4752);
    			attr_dev(li1, "class", "border-b border-gray-500  py-3 px-3 hover:text-blue-700");
    			add_location(li1, file, 110, 2, 4652);
    			attr_dev(i2, "class", "material-icons text-base mr-1 align-middle");
    			add_location(i2, file, 111, 60, 4906);
    			attr_dev(i3, "class", "material-icons float-right align-middle");
    			add_location(i3, file, 111, 138, 4984);
    			attr_dev(li2, "class", "border-b border-gray-500 py-3 px-3 hover:text-blue-700 group-hover:text-white");
    			add_location(li2, file, 113, 4, 5191);
    			attr_dev(li3, "class", "border-b border-gray-500 py-3 px-3 hover:text-blue-700");
    			add_location(li3, file, 114, 4, 5301);
    			attr_dev(li4, "class", "py-3 px-3 hover:text-blue-700");
    			add_location(li4, file, 115, 4, 5392);
    			attr_dev(ul0, "class", "hidden absolute bg-gray-300 w-40 top-0 text-gray-800 border border-gray-400 group-hover:block group-hover:text-white svelte-15cbukr");
    			add_location(ul0, file, 112, 3, 5056);
    			attr_dev(li5, "class", " py-3 px-3 relative hover:text-blue-700 group");
    			add_location(li5, file, 111, 2, 4848);
    			attr_dev(ul1, "id", "menu");
    			attr_dev(ul1, "class", "bg-gray-300 rounded inline-block text-sm border border-gray-400 cursor-pointer absolute svelte-15cbukr");
    			set_style(ul1, "top", /*p*/ ctx[1].y + "px");
    			set_style(ul1, "left", /*p*/ ctx[1].x + "px");
    			toggle_class(ul1, "hidden", /*p*/ ctx[1].y === 0);
    			add_location(ul1, file, 108, 1, 4281);
    			add_location(main, file, 78, 0, 3108);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, p0);
    			append_dev(p0, span0);
    			append_dev(p0, t1);
    			append_dev(p0, span1);
    			append_dev(p0, t3);
    			append_dev(p0, span2);
    			append_dev(main, t5);
    			append_dev(main, p1);
    			append_dev(p1, span3);
    			append_dev(p1, t7);
    			append_dev(p1, span4);
    			append_dev(p1, t9);
    			append_dev(p1, span5);
    			append_dev(p1, t11);
    			append_dev(p1, span6);
    			append_dev(main, t13);
    			append_dev(main, p2);
    			append_dev(p2, span7);
    			append_dev(span7, t14);
    			append_dev(p2, t15);
    			append_dev(p2, button);
    			append_dev(main, t17);
    			append_dev(main, p3);
    			append_dev(main, t19);
    			append_dev(main, h1);
    			append_dev(h1, t20);
    			append_dev(h1, br);
    			append_dev(h1, t21);
    			append_dev(main, t22);
    			append_dev(main, h2);
    			append_dev(main, t24);
    			append_dev(main, p4);
    			p4.innerHTML = /*text*/ ctx[0];
    			append_dev(main, t25);
    			append_dev(main, ul1);
    			append_dev(ul1, li0);
    			append_dev(li0, i0);
    			append_dev(li0, t27);
    			append_dev(ul1, t28);
    			append_dev(ul1, li1);
    			append_dev(li1, i1);
    			append_dev(li1, t30);
    			append_dev(ul1, t31);
    			append_dev(ul1, li5);
    			append_dev(li5, i2);
    			append_dev(li5, t33);
    			append_dev(li5, i3);
    			append_dev(li5, t35);
    			append_dev(li5, ul0);
    			append_dev(ul0, li2);
    			append_dev(ul0, t37);
    			append_dev(ul0, li3);
    			append_dev(ul0, t39);
    			append_dev(ul0, li4);

    			if (!mounted) {
    				dispose = [
    					listen_dev(
    						button,
    						"click",
    						function () {
    							if (is_function(copyCitation(/*citation*/ ctx[2]))) copyCitation(/*citation*/ ctx[2]).apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(p4, "click", /*onSelection*/ ctx[4], false, false, false),
    					listen_dev(li0, "click", /*copyWithCitation*/ ctx[3], false, false, false),
    					listen_dev(li1, "click", /*highlightSelection*/ ctx[5], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			if (dirty & /*citation*/ 4) set_data_dev(t14, /*citation*/ ctx[2]);
    			if (dirty & /*text*/ 1) p4.innerHTML = /*text*/ ctx[0];
    			if (dirty & /*p*/ 2) {
    				set_style(ul1, "top", /*p*/ ctx[1].y + "px");
    			}

    			if (dirty & /*p*/ 2) {
    				set_style(ul1, "left", /*p*/ ctx[1].x + "px");
    			}

    			if (dirty & /*p*/ 2) {
    				toggle_class(ul1, "hidden", /*p*/ ctx[1].y === 0);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function copyCitation(text) {
    	var dummy = document.createElement("textarea");
    	document.body.appendChild(dummy);
    	dummy.value = text;
    	dummy.select();
    	document.execCommand("copy");
    	document.body.removeChild(dummy);
    	alert("Copied");
    }

    function instance($$self, $$props, $$invalidate) {
    	let { citation = "671 F.3d 1113 (9th Cir, 2012)" } = $$props;
    	let { text = "The Plaintiffs/Appellants are the elected Chairman and Vice Chairman of Sardauna Local Government Council of Taraba State who were elected for a tenure of three years from the date they were sworn in into office. The 1st to 12th Defendants/Respondents (the Councilors of the Local Government) served the Appellants with a suspension letter dated 27/072017 for a period of three months. After the expiration of the three months suspension, the Governor of Taraba State extended the suspension for an indefinite term by a letter. By an Originating Summons, the Appellants sought for the following declarations against the Respondents, among others: an order of this court declaring the act of 1st to 15th Defendants in purporting to suspend the Plaintiffs and thereafter proceed to investigate them as unconstitutional, illegal, null and void abinitio; an order of this court vacating the 11th Defendant from office as acting Chairman of Sardauna Local Government Council; an order of this court declaring the extension of the suspension of the Plaintiffs by the Defendants from their elected offices as unconstitutional, illegal, null and void. The lower Court heard and dismissed the case of the Appellants. Dissatisfied, the Appellants lodged an appeal before this court contending that Section 34 and 36 of the Taraba State Local Government Law, 2000 does not confer powers on a legislative council to suspend an elected Chairman and Vice Chairman." } = $$props;
    	let { p = { x: 0, y: 0 } } = $$props;
    	let selectedText = "";

    	window.addEventListener("click", function (e) {
    		if (!document.getElementById("text").contains(e.target)) {
    			$$invalidate(1, p = { x: 0, y: 0 });
    		}
    	});

    	function copyWithCitation(e) {
    		e.preventDefault();
    		e.stopPropagation();
    		let text = citation + " " + selectedText;
    		copyCitation(text);
    	}

    	function onSelection(e) {
    		let selection = window.getSelection();
    		selectedText = selection.toString();

    		if (!window.getSelection().isCollapsed) {
    			var sel = window.getSelection();
    			var range = document.createRange();
    			range.setStart(sel.anchorNode, sel.anchorOffset);
    			range.setEnd(sel.focusNode, sel.focusOffset);
    			var backwards = range.collapsed;
    			range.detach();
    			var rects = sel.getRangeAt(0).getClientRects();
    			var n = rects.length - 1;
    			($$invalidate(1, p.y = rects[n].top + 10, p), $$invalidate(1, p.x = rects[n].right, p));
    			document.getElementById("menu").style.top = p.y;
    			document.getElementById("menu").style.left = p.x;
    		} else {
    			$$invalidate(1, p = { x: 0, y: 0 });
    		}
    	}

    	function highlightSelection() {
    		$$invalidate(0, text = text.replace(/<[^>]*>?/gm, ""));
    		$$invalidate(0, text = text.replace(selectedText, "<span class=\"bg-yellow-400 text-black\">" + selectedText + "</span>"));
    	}

    	const writable_props = ["citation", "text", "p"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);

    	$$self.$$set = $$props => {
    		if ("citation" in $$props) $$invalidate(2, citation = $$props.citation);
    		if ("text" in $$props) $$invalidate(0, text = $$props.text);
    		if ("p" in $$props) $$invalidate(1, p = $$props.p);
    	};

    	$$self.$capture_state = () => ({
    		citation,
    		text,
    		p,
    		selectedText,
    		copyCitation,
    		copyWithCitation,
    		onSelection,
    		highlightSelection
    	});

    	$$self.$inject_state = $$props => {
    		if ("citation" in $$props) $$invalidate(2, citation = $$props.citation);
    		if ("text" in $$props) $$invalidate(0, text = $$props.text);
    		if ("p" in $$props) $$invalidate(1, p = $$props.p);
    		if ("selectedText" in $$props) selectedText = $$props.selectedText;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [text, p, citation, copyWithCitation, onSelection, highlightSelection];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { citation: 2, text: 0, p: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get citation() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set citation(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get text() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set text(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get p() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set p(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
