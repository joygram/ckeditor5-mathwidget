/**
 * @module math/insertmathcommand
 */

import { Command } from 'ckeditor5/src/core';

const MOCK_Math_CODE = '\\[ x=\\frac{-b \\pm \\sqrt{b^2 -4ac}}{2a} \\] \\[ E = mc^2 \\]';

/**
 * The insert math command.
 *
 * Allows to insert math.
 *
 * @extends module:core/command~Command
 */
export default class InsertMathCommand extends Command {
	/**
	 * @inheritDoc
	 */
	refresh() {
		const documentSelection = this.editor.model.document.selection;
		const selectedElement = documentSelection.getSelectedElement();

		if (selectedElement && selectedElement.name === 'math') {
			this.isEnabled = false;
		} else {
			this.isEnabled = true;
		}
	}

	/**
	 * @inheritDoc
	 * 에디터 모델에 math 엘리먼트 생성
	 */
	execute() {
		const editor = this.editor;
		const model = editor.model;
		let mathItem;

		model.change(writer => {
			mathItem = writer.createElement('math', {
				displayMode: 'split',
				source: MOCK_Math_CODE
			});

			model.insertContent(mathItem);
		});

		return mathItem;
	}
}
