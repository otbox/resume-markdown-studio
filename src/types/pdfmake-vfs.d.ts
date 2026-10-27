declare module "pdfmake/build/vfs_fonts" {
  const vfsFonts: {
    pdfMake?: { vfs: Record<string, string> };
    vfs?: Record<string, string>;
  };
  export default vfsFonts;
}
