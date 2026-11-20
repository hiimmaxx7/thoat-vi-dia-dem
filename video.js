(() => {
  if (globalThis.tuaVideoDaGan) return;
  globalThis.tuaVideoDaGan = true;

  const tocDo = 16;
  const timKhung = () => document.querySelector('#course_lesson_iframe');
  let boDem;
  let videoTruoc;
  let lucKetThuc;
  let choBai;
  let loi = '';

  function doc() {
    const khung = timKhung();
    return {
      bat: Boolean(boDem),
      dungDuoc: Boolean(boDem || khung),
      loi: khung || boDem ? loi || 'Bấm để phát nhanh và tự chuyển video.' : 'Chưa tìm thấy khung video bài học.'
    };
  }

  function bao(noiDung) {
    if (loi === noiDung) return;
    loi = noiDung;
    chrome.runtime.sendMessage({ loai: 'tua-video', duLieu: doc() }).catch(() => {});
  }

  function dung(noiDung) {
    clearInterval(boDem);
    boDem = undefined;
    if (videoTruoc) videoTruoc.playbackRate = 1;
    videoTruoc = undefined;
    lucKetThuc = undefined;
    choBai = undefined;
    bao(noiDung);
  }

  function timBaiTiep(khung) {
    const maBai = new URL(khung.src, document.baseURI).searchParams.get('id');
    if (!maBai) return null;
    const danhSach = [...document.querySelectorAll('.item_hoclieu_title[onclick]')];
    const viTri = danhSach.flatMap((bai, chiSo) => {
      const thamSo = bai.getAttribute('onclick').matchAll(/'([^']*)'|"([^"]*)"|(?:[(,]\s*)(\d+)(?=\s*[,)]|$)/g);
      return Array.from(thamSo).some(([, nhayDon, nhayDoi, so]) =>
        (nhayDon ?? nhayDoi ?? so) === maBai
      ) ? [chiSo] : [];
    });
    return viTri.length === 1 ? danhSach[viTri[0] + 1] : null;
  }

  function kiemTra() {
    const khung = timKhung();
    const taiLieu = khung?.contentDocument;
    const video = taiLieu?.querySelector('video');

    if (choBai) {
      if (!video || (taiLieu === choBai.taiLieu && video === videoTruoc &&
          (video.ended || video.currentSrc === choBai.nguon))) {
        if (Date.now() >= choBai.han) dung('Đã dừng vì video kế tiếp chưa tải.');
        return;
      }
      choBai = undefined;
      videoTruoc.playbackRate = 1;
      videoTruoc = undefined;
    }

    if (!video) {
      if (khung?.src && !taiLieu) {
        dung('Không đọc được video. Kiểm tra iframe có cùng origin với trang bài học.');
      } else {
        bao('Đang chờ video tải…');
      }
      return;
    }

    if (video !== videoTruoc) {
      if (videoTruoc) videoTruoc.playbackRate = 1;
      videoTruoc = video;
      lucKetThuc = undefined;
      video.playbackRate = tocDo;
      bao('Đang tua 16×. Hết video sẽ tự chuyển bài.');
      if (!video.ended) {
        video.play().catch(() => {
          if (boDem && video === videoTruoc && video.paused) {
            bao('Bấm Play trên video để tiếp tục tua 16×.');
          }
        });
      }
    }

    if (!video.ended) {
      lucKetThuc = undefined;
      if (video.playbackRate !== tocDo) video.playbackRate = tocDo;
      if (!video.paused) bao('Đang tua 16×. Hết video sẽ tự chuyển bài.');
      return;
    }

    lucKetThuc ??= Date.now();
    if (Date.now() - lucKetThuc < 1500) return;

    const baiTiep = timBaiTiep(khung);
    if (!baiTiep?.matches('.item_hoclieu_title_6')) {
      dung('Đã dừng. Hết danh sách, chưa xác định được bài hiện tại hoặc mục kế tiếp là dạng khác.');
      return;
    }

    choBai = { taiLieu, nguon: video.currentSrc, han: Date.now() + 20000 };
    bao('Đang chuyển sang video kế tiếp…');
    baiTiep.click();
  }

  chrome.runtime.onMessage.addListener((tin, nguoiGui, traLoi) => {
    if (nguoiGui.id !== chrome.runtime.id) return;
    if (tin.lenh === 'doi') {
      if (boDem) {
        dung('Đã dừng tua.');
      } else if (timKhung()) {
        boDem = setInterval(kiemTra, 500);
        kiemTra();
      }
    }
    if (tin.lenh === 'doc' || tin.lenh === 'doi') traLoi(doc());
  });
})();
