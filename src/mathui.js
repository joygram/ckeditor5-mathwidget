/**
 * @module math/mathui
 */

import { Plugin } from 'ckeditor5/src/core';
import { ButtonView } from 'ckeditor5/src/ui';

import insertMathIcon from '../theme/icons/math.svg';
import previewModeIcon from '../theme/icons/preview-mode.svg';
import splitModeIcon from '../theme/icons/split-mode.svg';
import sourceModeIcon from '../theme/icons/source-mode.svg';
import infoIcon from '../theme/icons/info.svg';

/* global window, document */

export default class MathUI extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get pluginName() {
		return 'MathUI';
	}

	/**
	 * @inheritDoc
	 */
	init() {
		this._addButtons();
	}

	/**
	 * Adds all math-related buttons.
	 *
	 * @private
	 */
	_addButtons() {
		const editor = this.editor;

		this._addInsertMathButton();
		this._addMathInfoButton();
		this._createToolbarButton(editor, 'mathPreview', 'Preview', previewModeIcon);
		this._createToolbarButton(editor, 'mathSourceView', 'Source view', sourceModeIcon);
		this._createToolbarButton(editor, 'mathSplitView', 'Split view', splitModeIcon);
	}

	/**
	 * Adds the button for inserting math.
	 *
	 * @private
	 */
	_addInsertMathButton() {
		const editor = this.editor;
		const t = editor.t;
		const view = editor.editing.view;

		editor.ui.componentFactory.add('math', locale => {
			const buttonView = new ButtonView(locale);
			const command = editor.commands.get('insertMathCommand'); //from _registerCommands

			buttonView.set({
				label: t('Math'),
				icon: insertMathIcon,
				tooltip: true
			});

			buttonView.bind('isOn', 'isEnabled').to(command, 'value', 'isEnabled');

			// Execute the command when the button is clicked.
			command.listenTo(buttonView, 'execute', () => {
				const mathItem = editor.execute('insertMathCommand');
				const mathItemViewElement = editor.editing.mapper.toViewElement(mathItem);

				view.scrollToTheSelection();
				view.focus();

				if (mathItemViewElement) {
					const mathItemDomElement = view.domConverter.viewToDom(mathItemViewElement, document);

					if (mathItemDomElement) {
						mathItemDomElement.querySelector('.ck-math__editing-view').focus();
					}
				}
			});

			return buttonView;
		});
	}

	/**
	 * Adds the button linking to the math guide.
	 *
	 * @private
	 */
	_addMathInfoButton() {
		const editor = this.editor;
		const t = editor.t;

		editor.ui.componentFactory.add('mathInfo', locale => {
			const buttonView = new ButtonView(locale);
			const link = 'https://ckeditor.com/blog/basic-overview-of-creating-flowcharts-using-math/';

			buttonView.set({
				label: t('Read more about Math diagram syntax'),
				icon: infoIcon,
				tooltip: true
			});

			buttonView.on('execute', () => {
				window.open(link, '_blank', 'noopener');
			});

			return buttonView;
		});
	}

	/**
	 * Adds the math balloon toolbar button.
	 *
	 * @private
	 * @param {module:core/editor/editor~Editor} editor
	 * @param {String} name Name of the button.
	 * @param {String} label Label for the button.
	 * @param {String} icon The button icon.
	 */
	_createToolbarButton(editor, name, label, icon) {
		const t = editor.t;

		editor.ui.componentFactory.add(name, locale => {
			const buttonView = new ButtonView(locale);
			const command = editor.commands.get(`${name}Command`);

			buttonView.set({
				label: t(label),
				icon,
				tooltip: true
			});

			buttonView.bind('isOn', 'isEnabled').to(command, 'value', 'isEnabled');

			// Execute the command when the button is clicked.
			command.listenTo(buttonView, 'execute', () => {
				editor.execute(`${name}Command`);
				editor.editing.view.scrollToTheSelection();
				editor.editing.view.focus();
			});

			return buttonView;
		});
	}
}
