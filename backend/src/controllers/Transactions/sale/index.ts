import addSale from './add.js';
import getSales from './get.js';
export { addSale, getSales };

// async function validateDetails({
//   details = [],
//   index,
// }: {
//   details: z.infer<typeof detailSchema>[];
//   index: number;
// }) {
//   const errorsList: { index: number; message: string }[] = [];
//   if (details.length > 0) {
//     for (const sale of details) {
//       try {
//         detailSchema.parse(sale);
//       } catch (err: any) {
//         if (err instanceof ZodError) {
//           const errorMessage = err.errors
//             .map((e) =>
//               e.message === 'Required'
//                 ? `${e.path.join('.') || 'field'} is required`
//                 : e.message
//             )
//             .join(' & ');

//           errorsList.push({
//             index: index,
//             message: errorMessage,
//           });
//         } else {
//           errorsList.push({
//             index: index,
//             message: err.message || 'Unknown error',
//           });
//         }
//       }
//     }
//     if (errorsList.length > 0) {
//       throwError(`${errorsList[0].index} - ${errorsList[0].message}`);
//       return;
//     }
//   }
// }
