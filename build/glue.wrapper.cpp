extern "C" {
#include <libavutil/opt.h>
#include <libavutil/time.h>
#include <libavcodec/avcodec.h>
#include <libavformat/avformat.h>
#include <libavformat/avio.h>
#include <libavutil/avstring.h>
#include <libavutil/avassert.h>
#include <libswscale/swscale.h>
#include <libswresample/swresample.h>

#define SCALE_DOWN 1
#define DROP_FRAMES 1

#define TMPENCDEC_BUFSIZE (256 * 1024)
#define OUTPUT_BUFSIZE (48 * 1024 * 1024)

// #define av_hex_dump_log(...) ((void)0)

typedef struct {
    size_t size;
    uint8_t *ptr;
} BufferPtr;

static int read_packet(void *udata, uint8_t *buf, int buf_size) {
    BufferPtr *bp = (BufferPtr *)udata;
    buf_size = FFMIN(buf_size, bp->size);

    // av_log(NULL, AV_LOG_DEBUG, "read_packet ptr:%p size:%lu - %d bytes\n", bp->ptr, bp->size, buf_size);

    if (!buf_size)
        return AVERROR_EOF;

    memcpy(buf, bp->ptr, buf_size);
    bp->ptr  += buf_size;
    bp->size -= buf_size;
    return buf_size;
}

static int write_packet(void *udata, uint8_t *buf, int buf_size) {
    BufferPtr *bp = (BufferPtr *)udata;

    // av_log(NULL, AV_LOG_DEBUG, "write_packet ptr:%p size:%lu - %p:%d bytes\n", bp->ptr, bp->size, buf, buf_size);
    // av_hex_dump_log(NULL, AV_LOG_DEBUG, buf, buf_size);

    if (buf_size > bp->size) {
        av_log(NULL, AV_LOG_PANIC, "write_packet: BUFFER OVERFLOW\n");
        return AVERROR(EOVERFLOW);
    }

    memcpy(bp->ptr, buf, buf_size);
    bp->ptr  += buf_size;
    bp->size -= buf_size;
    return buf_size;
}

}
#include <string>

class avcodec {
  AVStream *pVideoInStream;
  AVStream *pAudioInStream;
  AVStream *pVideoOutStream;
  AVStream *pAudioOutStream;
  AVCodec *pVideoEncoderCodec;
  AVCodec *pAudioEncoderCodec;
  AVInputFormat *pAVInputFormat;
  AVCodecContext *pVideoEncoderContext;
  AVCodecContext *pAudioEncoderContext;
  AVFormatContext *pAVFormatInContext;
  AVFormatContext *pAVFormatOutContext;
  AVFrame *pSwsFrame;
  struct SwsContext *pSwsCxt;
  uint8_t *IOBufferOut;
  BufferPtr in_bp = { 0 };
  BufferPtr out_bp = { 0 };
public:
  avcodec() {
    av_register_all();
    av_log_set_level(AV_LOG_TRACE);
  }
  int init() {
    pAVInputFormat = NULL;
    pAVFormatInContext = NULL;
    pAVFormatOutContext = NULL;

    if (!(pVideoEncoderCodec = avcodec_find_encoder(AV_CODEC_ID_VP8))) {
        return -1;
    }
    if (!(pAudioEncoderCodec = avcodec_find_encoder(AV_CODEC_ID_OPUS))) {
        return -2;
    }
    if (avformat_alloc_output_context2(&pAVFormatOutContext, NULL, "webm", NULL) < 0) {
        return -3;
    }

    if (!(pAVFormatInContext = avformat_alloc_context())) {
        return -4;
    }

    if (!(IOBufferOut = (uint8_t *)av_malloc(OUTPUT_BUFSIZE))) {
        return -5;
    }

    pAVFormatOutContext->pb = avio_alloc_context((uint8_t *)av_malloc(TMPENCDEC_BUFSIZE), TMPENCDEC_BUFSIZE - AV_INPUT_BUFFER_PADDING_SIZE, 1, &out_bp, NULL, &write_packet, NULL);
    if (!pAVFormatOutContext->pb) {
        return -6;
    }

    pAVFormatInContext->pb = avio_alloc_context((uint8_t *)av_malloc(TMPENCDEC_BUFSIZE), TMPENCDEC_BUFSIZE - AV_INPUT_BUFFER_PADDING_SIZE, 0, &in_bp, &read_packet, NULL, NULL);
    if (!pAVFormatInContext->pb) {
        return -7;
    }

    // pAVFormatInContext->pb->direct = 1;
    // pAVFormatOutContext->pb->direct = 1;

    return 0;
  }
  int transcode(const unsigned char* data, long size) {
    int res = 0, frame_cnt = 0;
    AVPacket dpkt;
    time_t t;

    in_bp.ptr = (uint8_t*)data;
    in_bp.size = size;
    out_bp.ptr = IOBufferOut;
    out_bp.size = OUTPUT_BUFSIZE;

    if (!pAVInputFormat && (res = probe(data, size)) < 0) {
        return res;
    }

    // av_log_set_level(AV_LOG_PANIC);
    t = time(NULL);
    while (av_read_frame(pAVFormatInContext, &dpkt) >= 0) {
        AVStream *stream = pAVFormatInContext->streams[dpkt.stream_index];
        AVCodecContext *ctx = stream->codec;
        enum AVMediaType type = ctx->codec_type;
        int video = type == AVMEDIA_TYPE_VIDEO;

        if ((type == AVMEDIA_TYPE_AUDIO && pAudioInStream) || video) {
            int got_frame = 0;
            AVFrame *frame = av_frame_alloc();
            if (!frame) {
                res = AVERROR(ENOMEM);
                break;
            }
            av_packet_rescale_ts(&dpkt, stream->time_base, ctx->time_base);

            if (video) {
                res = avcodec_decode_video2(ctx, frame, &got_frame, &dpkt);
                if (got_frame) frame_cnt++;
            }
            else {
                res = avcodec_decode_audio4(ctx, frame, &got_frame, &dpkt);
            }

            // av_log(pAVFormatInContext, AV_LOG_TRACE, "decoding frame at index %d, res:%d, type:%d, gop:%d\n", dpkt.stream_index, res, type, got_frame);

            if (res >= 0 && got_frame) {
                #if DROP_FRAMES
                if (video && frame_cnt % 2) av_frame_free(&frame); else
                #endif
                if ((res = mux(frame, dpkt.stream_index, type, &got_frame)) < 0) {
                    av_log(NULL, AV_LOG_DEBUG, "Muxing failed for stream %d, type:%d, res:%d\n", dpkt.stream_index, type, res);
                }
            }
            else {
                av_frame_free(&frame);
            }

            if (res < 0) {
                av_log(NULL, AV_LOG_DEBUG, "transcoding failed: %d\n", res);
                break;
            }
        }

        av_free_packet(&dpkt);
    }
    // av_log_set_level(AV_LOG_TRACE);

    t = time(NULL) - t;
    printf("Transcoding finished in %ds for %d frames, %d fps\n", t, frame_cnt, frame_cnt/t);

    flush();
    // av_write_trailer(pAVFormatOutContext);

    return res < 0 ? res : frame_cnt;
  }
  long const getBufferLength() {
    return OUTPUT_BUFSIZE - out_bp.size;
  }
  unsigned char *const getBuffer() {
    return (unsigned char *const)IOBufferOut;
  }
  const char* status() {
    return to_c("Hello world.");
  }
  void kill() {

  }
private:
  int mux(AVFrame *frame, int stream_index, enum AVMediaType type, int *got_frame) {
    AVFrame *out_frame = frame;
    AVStream *stream = pAVFormatOutContext->streams[stream_index];
    AVPacket pkt;
    int res;

    pkt.size = 0;
    pkt.data = NULL;
    av_init_packet(&pkt);

    #if SCALE_DOWN
    if (frame && pSwsCxt) {
        sws_scale(pSwsCxt, ((AVPicture*)frame)->data, ((AVPicture*)frame)->linesize, 0,
            pVideoInStream->codec->height, ((AVPicture *)pSwsFrame)->data, ((AVPicture *)pSwsFrame)->linesize);
        out_frame = pSwsFrame;
    }
    #endif /* SCALE_DOWN */

    if (out_frame) {
        out_frame->pict_type = AV_PICTURE_TYPE_NONE;
        out_frame->pts = frame->best_effort_timestamp;
    }

    if (type == AVMEDIA_TYPE_VIDEO) {
        res = avcodec_encode_video2(stream->codec, &pkt, out_frame, got_frame);
    }
    else {
        res = avcodec_encode_audio2(stream->codec, &pkt, out_frame, got_frame);
    }
    av_frame_free(frame ? &frame : NULL);

    // av_log(NULL, AV_LOG_TRACE, "encoding frame at index %d, res:%d, type:%d, gop:%d (%d)\n", stream_index, res, type, *got_frame, pkt.size);

    if (res >= 0 && *got_frame) {
        pkt.stream_index = stream_index;
        av_packet_rescale_ts(&pkt, stream->codec->time_base, stream->time_base);

        if (pAudioInStream) {
            res = av_interleaved_write_frame(pAVFormatOutContext, &pkt);
        }
        else {
            res = av_write_frame(pAVFormatOutContext, &pkt);
        }
    }
    return res;
  }
  int flush() {
    int i, res = 0;

    for (i = 0; i < pAVFormatInContext->nb_streams; i++) {
        AVStream *stream = pAVFormatInContext->streams[i];
        AVCodecContext *ctx = stream->codec;
        enum AVMediaType type = ctx->codec_type;
        int video = type == AVMEDIA_TYPE_VIDEO;

        if (((video && pVideoInStream) || (type == AVMEDIA_TYPE_AUDIO && pAudioInStream))
                && (pAVFormatOutContext->streams[i]->codec->codec->capabilities & AV_CODEC_CAP_DELAY)) {

            int got_frame;

            do {
                av_log(NULL, AV_LOG_DEBUG, "Flushing encoder for stream at index %d...\n", i);

                if ((res = mux(NULL, i, type, &got_frame)) < 0) {
                    av_log(NULL, AV_LOG_DEBUG, "Flushing failed for stream %d, type:%d, res:%d\n", i, type, res);
                    break;
                }
            } while (got_frame);
        }
    }
    return res;
  }
  int probe(const unsigned char* data, long size) {
    int i;
    AVProbeData probe_data;
    probe_data.filename = "";
    probe_data.buf_size = size;
    probe_data.buf = (unsigned char *) data;

    pAVInputFormat = av_probe_input_format(&probe_data, 1);
    if (!pAVInputFormat) {
        pAVInputFormat = av_probe_input_format(&probe_data, 0);
    }
    probe_data.buf = NULL;

    if (avformat_open_input(&pAVFormatInContext, NULL, pAVInputFormat, NULL) < 0) {
        return -1;
    }

    if (avformat_find_stream_info(pAVFormatInContext, NULL) < 0) {
        return -2;
    }

    pSwsCxt = NULL;
    pVideoInStream = NULL;
    pAudioInStream = NULL;
    for (i = 0; i < pAVFormatInContext->nb_streams; i++) {
        AVStream *stream = pAVFormatInContext->streams[i];
        AVCodecContext *codec = stream->codec;
        enum AVMediaType type = codec->codec_type;
        int video = type == AVMEDIA_TYPE_VIDEO;

        if ((video && !pVideoInStream) || (0 && type == AVMEDIA_TYPE_AUDIO && !pAudioInStream)) {
            AVCodec *encoder = video ? pVideoEncoderCodec : pAudioEncoderCodec;
            AVStream *out_stream = avformat_new_stream(pAVFormatOutContext, encoder);
            AVCodecContext *out_codec = out_stream->codec;
            AVDictionary *opts = NULL;

            if (video) {
                out_codec->width = codec->width;
                out_codec->height = codec->height;
                out_codec->time_base = codec->time_base;
                out_codec->pix_fmt = AV_PIX_FMT_YUV420P;
                out_codec->sample_aspect_ratio = codec->sample_aspect_ratio;

                out_codec->qmin = 21;
                out_codec->qmax = 23;
                av_dict_set(&opts, "crf", "21", 0);
                av_dict_set(&opts, "speed", "6", 0);

                #if SCALE_DOWN
                float target_width = 1280.0f;
                float target_height = 720.0f;

                if (codec->width > target_width || codec->height > target_height) {
                    float ratio = FFMIN(target_width / codec->width, target_height / codec->height);

                    target_width = codec->width * ratio;
                    target_height = codec->height * ratio;
                    pSwsCxt = sws_getContext(codec->width, codec->height, codec->pix_fmt,
                        target_width, target_height, out_codec->pix_fmt, SWS_FAST_BILINEAR, NULL, NULL, NULL);

                    if (pSwsCxt) {
                        if ((pSwsFrame = av_frame_alloc())) {
                            uint8_t *buffer;
                            int size = avpicture_get_size(out_codec->pix_fmt, target_width, target_height);

                            if ((buffer = (uint8_t *)av_malloc(size * sizeof(uint8_t)))) {
                                avpicture_fill((AVPicture *)pSwsFrame, buffer,
                                    out_codec->pix_fmt, target_width, target_height);

                                out_codec->width = (int)target_width;
                                out_codec->height = (int)target_height;
                            }
                            else {
                                av_frame_free(&pSwsFrame);
                                pSwsFrame = NULL;
                            }
                        }

                        if (!pSwsFrame) {
                            sws_freeContext(pSwsCxt);
                            pSwsCxt = NULL;
                        }
                    }
                    else {
                        av_log(NULL, AV_LOG_ERROR, "Failed to create scale context!\n");
                    }
                }
                #endif /* SCALE_DOWN */

                if (pSwsCxt || codec->width * codec->height > 1e6) {
                    out_codec->qmin = 23;
                    out_codec->qmax = 25;
                    out_codec->profile = 3;

                    av_dict_set(&opts, "crf", "23", 0);
                    av_dict_set(&opts, "speed", "15", 0);
                }

                codec->idct_algo = FF_IDCT_AUTO;
                codec->flags2 |= AV_CODEC_FLAG2_FAST;
                codec->skip_loop_filter = AVDISCARD_ALL;
                codec->workaround_bugs = FF_BUG_AUTODETECT;
                av_dict_set(&opts, "quality", "realtime", 0);
            }
            else {
                out_codec->channels = 2;
                out_codec->bit_rate = 96000;
                out_codec->sample_rate = 48000;
                out_codec->sample_fmt = AV_SAMPLE_FMT_S16;
                out_codec->channel_layout = AV_CH_LAYOUT_STEREO;
                out_codec->time_base = (AVRational){1, codec->sample_rate};
            }

            // out_codec->thread_count = 8;
            if (avcodec_open2(out_codec, encoder, &opts) < 0) {
                av_log(NULL, AV_LOG_ERROR, "Cannot open encoder for stream #%d\n", i);
                continue;
            }

            if (avcodec_open2(codec, avcodec_find_decoder(codec->codec_id), NULL) < 0) {
                av_log(NULL, AV_LOG_ERROR, "Cannot open decoder for stream #%d\n", i);
                continue;
            }

            if (pAVFormatOutContext->oformat->flags & AVFMT_GLOBALHEADER) {
                out_codec->flags |= AV_CODEC_FLAG_GLOBAL_HEADER;
            }

            if (video) {
                pVideoInStream = stream;
                pVideoOutStream = out_stream;
                pVideoEncoderContext = out_codec;
            }
            else {
                pAudioInStream = stream;
                pAudioOutStream = out_stream;
                pAudioEncoderContext = out_codec;
            }

            int unused = av_dict_count(opts);
            if (unused > 0) {
                av_log(NULL, AV_LOG_WARNING, "%d unused options\n", unused);
            }
        }
    }

    av_dump_format(pAVFormatInContext, 0, "in_stream", 0);

    if (!pVideoInStream) {
        return -9;
    }

    if (avformat_write_header(pAVFormatOutContext, NULL) < 0) {
        return -8;
    }
    av_dump_format(pAVFormatOutContext, 0, "out_stream", 1);
    av_hex_dump_log(pAVFormatOutContext, AV_LOG_DEBUG, IOBufferOut, 32);
    av_assert0(*((uint16_t *)IOBufferOut) == 0x451a);

    return 0;
  }
  const char* to_c(std::string s) {
    static char tmp[262144];
    int len = std::min(s.size(), sizeof(tmp) - 1);
    tmp[len] = '\0';
    while (len-- > 0) {
        tmp[len] = s[len];
    }
    return (const char *)&tmp;
  }
};

typedef long long LongLong;
typedef unsigned char* Uint8Array;
typedef unsigned int* Uint32Array;

#include "avcodec.glue.cpp"
