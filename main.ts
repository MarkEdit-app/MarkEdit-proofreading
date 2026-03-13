import { MarkEdit } from 'markedit-api';
import { proofreadingExtension } from './src/extension';

MarkEdit.addExtension(proofreadingExtension());
