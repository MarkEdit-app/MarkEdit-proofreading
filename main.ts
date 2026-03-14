import { MarkEdit } from 'markedit-api';
import { proofreadingExtension } from './src/extension';
import { addMenuItems } from './src/menu';

MarkEdit.addExtension(proofreadingExtension());
addMenuItems();
