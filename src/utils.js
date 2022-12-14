import global from '@ckeditor/ckeditor5-utils/src/dom/global';
import BalloonPanelView from '@ckeditor/ckeditor5-ui/src/panel/balloon/balloonpanelview';


export const g_model_name = 'mathwidget';
export const g_plugin_name = 'MathWidget';
export const g_css_name = 'ck-mathwidget';


export function checkIsOn(in_editor, in_command_name) {
	const selection = in_editor.model.document.selection;
	const item = selection.getSelectedElement() || selection.getLastPosition().parent;

	if (item && item.is('element', g_model_name) && item.getAttribute('displayMode') === in_command_name) {
		return true;
	}

	return false;
}


// Simple MathJax 3 version check
export function isMathJaxVersion3(version) {
	return version && typeof version === 'string' && version.split('.').length === 3 && version.split('.')[0] === '3';
}


export async function render(
	equation,
	mathConfig,
	element,
) {
	//katex
	let engine = mathConfig.engine;
	let lazyLoad = mathConfig.lazyLoad;
	let katexRenderOptions = mathConfig.katexRenderOptions;
	let display = false;

	if (engine === 'mathjax' && typeof MathJax !== 'undefined') {
		if (isMathJaxVersion3(MathJax.version)) {
			renderMathJax3(equation, element, () => { });
		} else {
			// Fixme: MathJax typesetting cause occasionally math processing error without asynchronous call
			global.window.setTimeout(() => {
				renderMathJax2(equation, element);
			});
		}
	} else if (engine === 'katex' && typeof katex !== 'undefined') {
		katex.render(equation, element, {
			throwOnError: false,
			displayMode: display,
			...katexRenderOptions
		});
	} else if (typeof engine === 'function') {
		engine(equation, element, display);
	} else {
		if (typeof lazyLoad !== 'undefined') {
			try {
				if (!global.window.CKEDITOR_MATH_LAZY_LOAD) {
					global.window.CKEDITOR_MATH_LAZY_LOAD = lazyLoad();
				}
				element.innerHTML = equation;
				await global.window.CKEDITOR_MATH_LAZY_LOAD;
				render(equation, mathConfig, element);
			}
			catch (err) {
				element.innerHTML = equation;
				console.error(`math-tex-typesetting-lazy-load-failed: Lazy load failed: ${err}`);
			}
		} else {
			element.innerHTML = equation;
			console.warn(`math-tex-typesetting-missing: Missing the mathematical typesetting engine (${engine}) for tex.`);
		}
	}
}

function renderMathJax3(equation, element, in_callback) {
	let promiseFunction = undefined;
	if (typeof MathJax.tex2chtmlPromise !== 'undefined') {
		promiseFunction = MathJax.tex2chtmlPromise;
	} else if (typeof MathJax.tex2svgPromise !== 'undefined') {
		promiseFunction = MathJax.tex2svgPromise;
	}

	if (typeof promiseFunction !== 'undefined') {
		promiseFunction(equation).then(node => {
			if (element.firstChild) {
				element.removeChild(element.firstChild);
			}
			element.appendChild(node);
			in_callback();
		});
	}
}

function renderMathJax2(equation, element) {
	element.innerHTML = '$$\n' + equation + '\n$$';

	MathJax.Hub.Queue(['Typeset', MathJax.Hub, element]);
}

