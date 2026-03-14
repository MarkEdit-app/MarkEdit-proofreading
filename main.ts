import { MarkEdit } from 'markedit-api';
import { proofreadingExtension } from './src/extension';
import { buildMenuItem } from './src/menu';

MarkEdit.addExtension(proofreadingExtension());
MarkEdit.addMainMenuItem(buildMenuItem());
