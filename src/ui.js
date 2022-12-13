/**
 * @module mathwidget/mathui
 */

import { Plugin } from 'ckeditor5/src/core';
import { ButtonView } from 'ckeditor5/src/ui';

import insertIcon from '../theme/icons/math.svg';
import previewModeIcon from '../theme/icons/preview-mode.svg';
import splitModeIcon from '../theme/icons/split-mode.svg';
import sourceModeIcon from '../theme/icons/source-mode.svg';
import infoIcon from '../theme/icons/info.svg';

import { g_plugin_name, g_model_name, g_css_name } from './utils';
/* global window, document */

export default class UI extends Plugin {
	static get pluginName() {
		return `${g_plugin_name}UI`;
	}

	init() {
		this._addButtons();
	}

	_addButtons() {
		const editor = this.editor;

		this._addInsertButton();
		this._addInfoButton();
		this._createToolbarButton(editor, `Preview${g_plugin_name}`, 'Preview', previewModeIcon);
		this._createToolbarButton(editor, `SourceView${g_plugin_name}`, 'Source view', sourceModeIcon);
		this._createToolbarButton(editor, `SplitView${g_plugin_name}`, 'Split view', splitModeIcon);
	}

	/**
	 * Adds the button for inserting math.
	 *
	 * @private
	 */
	_addInsertButton() {
		const editor = this.editor;
		const t = editor.t;
		const view = editor.editing.view;
		const cmd_name = `Insert${g_plugin_name}Command`;

		editor.ui.componentFactory.add(`${g_model_name}`, locale => {
			const buttonView = new ButtonView(locale);
			const command = editor.commands.get(cmd_name); //from _registerCommands

			buttonView.set({
				label: t(g_plugin_name),
				icon: insertIcon,
				tooltip: true
			});

			buttonView.bind('isOn', 'isEnabled').to(command, 'value', 'isEnabled');

			// Execute the command when the button is clicked.
			command.listenTo(buttonView, 'execute', () => {
				const item = editor.execute(cmd_name);
				const view_element = editor.editing.mapper.toViewElement(item);

				view.scrollToTheSelection();
				view.focus();

				if (view_element) {
					const item_dom_element = view.domConverter.viewToDom(view_element, document);

					if (item_dom_element) {
						item_dom_element.querySelector(`.${g_css_name}__editing-view`).focus();
					}
				}
			});

			return buttonView;
		});
	}

	_addInfoButton() {
		const editor = this.editor;
		const t = editor.t;

		editor.ui.componentFactory.add(`Info${g_plugin_name}`, locale => {
			const buttonView = new ButtonView(locale);
			const link = 'https://github.com/joygram/ckeditor5-mathwidget';

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


	_createToolbarButton(editor, in_name, label, icon) {
		const t = editor.t;

		editor.ui.componentFactory.add(in_name, locale => {
			const buttonView = new ButtonView(locale);
			const command = editor.commands.get(`${in_name}Command`);

			buttonView.set({
				label: t(label),
				icon,
				tooltip: true
			});

			buttonView.bind('isOn', 'isEnabled').to(command, 'value', 'isEnabled');

			// Execute the command when the button is clicked.
			command.listenTo(buttonView, 'execute', () => {
				editor.execute(`${in_name}Command`);
				editor.editing.view.scrollToTheSelection();
				editor.editing.view.focus();
			});

			return buttonView;
		});
	}
}
