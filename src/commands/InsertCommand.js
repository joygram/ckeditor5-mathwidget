import { Command } from 'ckeditor5/src/core';
import { g_plugin_name, g_model_name, g_css_name } from '../utils';


const MOCK_Math_CODE = 'x=\\frac{-b \\pm \\sqrt{b^2 -4ac}}{2a} \\\\  E = mc^2 ';

export default class InsertCommand extends Command {
	/**
	 * @inheritDoc
	 */
	refresh() {
		const documentSelection = this.editor.model.document.selection;
		const selectedElement = documentSelection.getSelectedElement();

		if (selectedElement && selectedElement.name === g_model_name) {
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
		let item;

		model.change(writer => {
			item = writer.createElement(g_model_name, {
				displayMode: 'split',
				source: MOCK_Math_CODE
			});

			model.insertContent(item);
		});

		return item;
	}
}
