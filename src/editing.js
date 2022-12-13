/**
 * @module mathwidget/mathediting
 */

import { Plugin } from 'ckeditor5/src/core';
import { toWidget } from 'ckeditor5/src/widget';

import { debounce } from 'lodash-es';

import PreviewCommand from './commands/PreviewCommand';
import SourceViewCommand from './commands/SourceViewCommand';
import SplitViewCommand from './commands/SplitViewCommand';
import InsertCommand from './commands/InsertCommand';

import { render } from './utils';
import { g_plugin_name, g_model_name, g_css_name } from './utils';


// Time in milliseconds.
const DEBOUNCE_TIME = 300;

/* global window */

export default class Editing extends Plugin {
	static get pluginName() {
		return `${g_plugin_name}Editing`;
	}


	init() {
		this._registerCommands();
		this._defineConverters();

		this.editor.config.define(g_model_name, {
			engine: 'mathjax',
			outputType: 'script',
			katexRenderOptions: {}
		});
	}


	afterInit() {
		//define schema
		this.editor.model.schema.register(g_model_name, {
			allowAttributes: ['displayMode', 'source'],
			allowWhere: '$block',
			isObject: true
		});
	}


	_registerCommands() {
		const editor = this.editor;

		editor.commands.add(`Preview${g_plugin_name}Command`, new PreviewCommand(editor));
		editor.commands.add(`SplitView${g_plugin_name}Command`, new SplitViewCommand(editor));
		editor.commands.add(`SourceView${g_plugin_name}Command`, new SourceViewCommand(editor));
		editor.commands.add(`Insert${g_plugin_name}Command`, new InsertCommand(editor));
	}

	_defineConverters() {
		const editor = this.editor;

		editor.data.downcastDispatcher.on(`insert:${g_model_name}`, this._mathDataDowncast.bind(this));
		editor.editing.downcastDispatcher.on(`insert:${g_model_name}`, this._mathDowncast.bind(this));
		editor.editing.downcastDispatcher.on(`attribute:source:${g_model_name}`, this._sourceAttributeDowncast.bind(this));

		editor.data.upcastDispatcher.on(`element:code`, this._mathUpcast.bind(this), { priority: 'high' });

		editor.conversion.for('editingDowncast').attributeToAttribute({
			model: {
				name: `${g_model_name}`,
				key: 'displayMode'
			},
			view: modelAttributeValue => ({
				key: 'class',
				value: `${g_css_name}__` + modelAttributeValue + '-mode'
			})
		});
	}


	_mathDataDowncast(evt, data, conversionApi) {
		const model = this.editor.model;
		const { writer, mapper } = conversionApi;

		if (!conversionApi.consumable.consume(data.item, 'insert')) {
			return;
		}

		const targetViewPosition = mapper.toViewPosition(model.createPositionBefore(data.item));
		// For downcast we're using only language-math class. We don't set class to `math language-math` as
		// multiple markdown converters that we have seen are using only `language-math` class and not `math` alone.
		const code = writer.createContainerElement('code', {
			class: `language-${g_model_name}`
		});
		const pre = writer.createContainerElement('pre', {
			spellcheck: 'false'
		});
		const sourceTextNode = writer.createText(data.item.getAttribute('source'));

		writer.insert(model.createPositionAt(code, 'end'), sourceTextNode);
		writer.insert(model.createPositionAt(pre, 'end'), code);
		writer.insert(targetViewPosition, pre);
		mapper.bindElements(data.item, code);
	}


	_mathDowncast(evt, data, conversionApi) {
		const { writer, mapper, consumable } = conversionApi;
		const { editor } = this;
		const { model, t } = editor;
		const that = this;

		if (!consumable.consume(data.item, 'insert')) {
			return;
		}

		const targetViewPosition = mapper.toViewPosition(model.createPositionBefore(data.item));

		const wrapperAttributes = {
			class: [`${g_css_name}__wrapper`]
		};
		const textareaAttributes = {
			class: [`${g_css_name}__editing-view`],
			placeholder: t(`Insert Code`),
			'data-cke-ignore-events': true
		};

		const wrapper = writer.createContainerElement('div', wrapperAttributes);
		const editingContainer = writer.createUIElement('textarea', textareaAttributes, createEditingTextarea);
		const previewContainer = writer.createUIElement('div', { class: [`${g_css_name}__preview`] }, createMathPreview);

		writer.insert(writer.createPositionAt(wrapper, 'start'), previewContainer);
		writer.insert(writer.createPositionAt(wrapper, 'start'), editingContainer);

		writer.insert(targetViewPosition, wrapper);

		mapper.bindElements(data.item, wrapper);

		return toWidget(wrapper, writer, {
			widgetLabel: t(`${g_plugin_name}`),
			hasSelectionHandle: true
		});

		function createEditingTextarea(domDocument) {
			const domElement = this.toDomElement(domDocument);

			domElement.value = data.item.getAttribute('source');

			const debouncedListener = debounce(event => {
				editor.model.change(writer => {
					writer.setAttribute('source', event.target.value, data.item);
				});
			}, DEBOUNCE_TIME);

			domElement.addEventListener('input', debouncedListener);

			/* Workaround for internal #1544 */
			domElement.addEventListener('focus', () => {
				const model = editor.model;
				const selectedElement = model.document.selection.getSelectedElement();

				// Move the selection onto the math widget if it's currently not selected.
				if (selectedElement !== data.item) {
					model.change(writer => writer.setSelection(data.item, 'on'));
				}
			}, true);

			return domElement;
		}

		function createMathPreview(domDocument) {
			// Taking the text from the wrapper container element for now
			const source = data.item.getAttribute('source');
			const domElement = this.toDomElement(domDocument);
			const config = editor.config.get(`${g_model_name}`);

			domElement.innerHTML = source;

			window.setTimeout(() => {
				// @todo: by the looks of it the domElement needs to be hooked to tree in order to allow for rendering.
				that._renderMath(source, config, domElement);
			}, 100);

			return domElement;
		}
	}

	/**
	 *
	 * @param {*} evt
	 * @param {*} data
	 * @param {*} conversionApi
	 * @returns
	 */
	_sourceAttributeDowncast(evt, data, conversionApi) {
		// @todo: test whether the attribute was consumed.
		const new_source = data.attributeNewValue;
		const domConverter = this.editor.editing.view.domConverter;

		if (new_source) {
			const data_view = conversionApi.mapper.toViewElement(data.item);
			const config = this.editor.config.get(`${g_model_name}`);


			for (const child of data_view.getChildren()) {
				if (child.name === 'textarea' && child.hasClass(`${g_css_name}__editing-view`)) {
					const domEditingTextarea = domConverter.viewToDom(child, window.document);

					if (domEditingTextarea.value != new_source) {
						domEditingTextarea.value = new_source;
					}
				} else if (child.name === 'div' && child.hasClass(`${g_css_name}__preview`)) {
					// @todo: we could optimize this and not refresh math if widget is in source mode.
					const domPreviewWrapper = domConverter.viewToDom(child, window.document);

					if (domPreviewWrapper) {
						domPreviewWrapper.innerHTML = new_source;
						// 세팅하는 부분이 있는지 체크
						domPreviewWrapper.removeAttribute('data-processed');

						this._renderMath(new_source, config, domPreviewWrapper);
					}
				}
			}
		}
	}


	_mathUpcast(evt, data, conversionApi) {
		const viewCodeElement = data.viewItem;
		const hasPreElementParent = !viewCodeElement.parent || !viewCodeElement.parent.is('element', 'pre');
		const hasCodeAncestors = data.modelCursor.findAncestor('code');
		const { consumable, writer } = conversionApi;

		//언어 단위로 찾을 수 있어야 한다 language-{r} language-{python} ...
		if (!viewCodeElement.hasClass(`language-${g_model_name}`) || hasPreElementParent || hasCodeAncestors) {
			return;
		}

		if (!consumable.test(viewCodeElement, { name: true })) {
			return;
		}
		const source = Array.from(viewCodeElement.getChildren())
			.filter(item => item.is('$text'))
			.map(item => item.data)
			.join('');

		const model_elem = writer.createElement(g_model_name, {
			source: source,
			displayMode: 'split'
		});

		// Let's try to insert math element.
		if (!conversionApi.safeInsert(model_elem, data.modelCursor)) {
			return;
		}

		consumable.consume(viewCodeElement, { name: true });

		conversionApi.updateConversionResult(model_elem, data);
	}

	/**
	 * Renders Math in a given `domElement`. Expect this domElement to have math
	 * source set as text content.
	 *
	 * @param {HTMLElement} domElement
	 */
	_renderMath(in_source, in_config, domElement) {
		//display : div or span
		render(in_source, in_config, domElement);
	}
}
