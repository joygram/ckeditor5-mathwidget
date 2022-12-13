import { Command } from 'ckeditor5/src/core';

import { checkIsOn } from '../utils';
import { g_plugin_name, g_model_name, g_css_name } from '../utils';

export default class SourceViewCommand extends Command {
	/**
	 * @inheritDoc
	 */
	refresh() {
		const editor = this.editor;
		const documentSelection = editor.model.document.selection;
		const selectedElement = documentSelection.getSelectedElement();
		const isSelectedElement = selectedElement && selectedElement.name === g_model_name;

		if (isSelectedElement || documentSelection.getLastPosition().findAncestor(g_model_name)) {
			this.isEnabled = !!selectedElement;
		} else {
			this.isEnabled = false;
		}

		this.value = checkIsOn(editor, 'source');
	}

	/**
	 * @inheritDoc
	 */
	execute() {
		const editor = this.editor;
		const model = editor.model;
		const documentSelection = this.editor.model.document.selection;
		const mathItem = documentSelection.getSelectedElement() || documentSelection.getLastPosition().parent;

		model.change(writer => {
			if (mathItem.getAttribute('displayMode') !== 'source') {
				writer.setAttribute('displayMode', 'source', mathItem);
			}
		});
	}
}
