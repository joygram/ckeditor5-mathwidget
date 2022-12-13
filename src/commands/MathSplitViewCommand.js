/**
 * @module math/mathsplitviewcommand
 */

import { Command } from 'ckeditor5/src/core';

import { checkIsOn } from '../utils';

/**
 * The math split view command.
 *
 * Allows to switch to a split view mode.
 *
 * @extends module:core/command~Command
 */
export default class MathSplitViewCommand extends Command {
	/**
	 * @inheritDoc
	 */
	refresh() {
		const editor = this.editor;
		const documentSelection = editor.model.document.selection;
		const selectedElement = documentSelection.getSelectedElement();
		const isSelectedElementMath = selectedElement && selectedElement.name === 'math';

		if (isSelectedElementMath || documentSelection.getLastPosition().findAncestor('math')) {
			this.isEnabled = !!selectedElement;
		} else {
			this.isEnabled = false;
		}

		this.value = checkIsOn(editor, 'split');
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
			if (mathItem.getAttribute('displayMode') !== 'split') {
				writer.setAttribute('displayMode', 'split', mathItem);
			}
		});
	}
}
