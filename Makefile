# Compile FFmpeg and all its dependencies to JavaScript.
# You need emsdk environment installed and activated, see:
# <https://kripken.github.io/emscripten-site/docs/getting_started/downloads.html>.

EMVER=1.38.32
EMPATH=/c/emsdk/emscripten/$(EMVER)
TARGET=build/avcodec.js
POST_JS=build/avcodec.glue.js
PRE_JS=build/pre.js

FILTERS = scale rotate
DEMUXERS = matroska avi
DECODERS = mpeg2video mpeg4 msmpeg4v* msvideo1 h26* mp3 aac* ac3* eac3*
PARSERS = aac* ac3* h26* mpeg*
ENCODERS = libvpx_vp8 libopus
MUXERS = webm

AVCODEC_BC = build/ffmpeg/libavcodec/libavcodec.a
SHARED_DEPS = \
	build/opus/dist/lib/libopus.so \
	build/libvpx/dist/lib/libvpx.so

CC=emcc
CXX=em++
INCLUDES=-I build/ffmpeg
DEFINES=-DUNICODE -DNDEBUG #-DNO_AVLOG
CFLAGS=$(DEFINES) -O3 --llvm-lto 3 -flto -ffast-math -funroll-loops \
	-finline-functions -fno-threadsafe-statics -fno-debug-macro -fomit-frame-pointer
SIMDFLAGS=#-s SIMD=1 -fno-vectorize #-msimd128
CXXFLAGS=-std=c++11 -fno-exceptions -fno-rtti $(CFLAGS)
OBJS=build/glue.wrapper.o
LIBS=\
	build/ffmpeg/libavformat/libavformat.a \
	build/ffmpeg/libswscale/libswscale.a \
	build/ffmpeg/libswresample/libswresample.a \
	$(AVCODEC_BC) \
	build/ffmpeg/libavutil/libavutil.a \
	$(SHARED_DEPS)
LDFLAGS=$(LIBS) \
	-s TOTAL_MEMORY=268435456 -s NO_FILESYSTEM=1 -s NO_DYNAMIC_EXECUTION=1 -s ABORTING_MALLOC=0 \
	-s DISABLE_EXCEPTION_CATCHING=1 -s AGGRESSIVE_VARIABLE_ELIMINATION=1 -s ASSERTIONS=0 \
	-s INVOKE_RUN=0 -s NO_EXIT_RUNTIME=1 -s TEXTDECODER=2 -s WASM=1 -s ENVIRONMENT=worker \
	--post-js $(POST_JS) --pre-js $(PRE_JS) -s TOTAL_STACK=4194304

all: $(TARGET)

clean: clean-js clean-opus clean-libvpx clean-ffmpeg
clean-js:
	@rm -fv build/*.o $(POST_JS) $(TARGET) $(TARGET:.js=.wasm)
clean-opus:
	-cd build/opus && rm -rf dist && make clean
clean-libvpx:
	-cd build/libvpx && rm -rf dist && make clean
clean-ffmpeg:
	-cd build/ffmpeg && make clean

update:
	@cd build/ffmpeg && git diff >../ffmpeg.patch && make clean && git reset --hard
	@cd build/libvpx && git diff >../libvpx.patch && make clean && git reset --hard
	@git submodule update --remote --merge

build/opus/configure:
	cd build/opus && ./autogen.sh && patch -p1 < ../opus.patch

build/opus/Makefile: build/opus/configure .git/modules/build/opus/FETCH_HEAD
	cd build/opus && \
	emconfigure ./configure \
		CC="emcc $(CFLAGS) $(SIMDFLAGS)" \
		--prefix="$$(pwd)/dist" \
		--host=x86-none-linux \
		--disable-static \
		--disable-doc \
		--enable-float-approx \
		--disable-extra-programs \
		--disable-asm \
		--disable-rtcd \
		--disable-intrinsics
	sed -i -E 's~python.*\\\\(\w+)~\\1~' build/opus/libtool
	sed -i -E 's~python.*\\\\(\w+)~\\1~' build/opus/Makefile
	@touch $@

build/opus/dist/lib/libopus.so: build/opus/Makefile
	cd build/opus && \
	emmake make -j8 && \
	emmake make install

build/libvpx/Makefile: .git/modules/build/libvpx/FETCH_HEAD
	cd build/libvpx && \
	git reset --hard && \
	patch -p1 < ../libvpx.patch && \
	emconfigure ./configure \
		--prefix="$$(pwd)/dist" \
		--target=generic-gnu \
		--disable-dependency-tracking \
		--disable-multithread \
		--disable-runtime-cpu-detect \
		--enable-shared \
		--disable-static \
		\
		--disable-examples \
		--disable-docs \
		--disable-unit-tests \
		--disable-webm-io \
		--disable-libyuv \
		--disable-vp8-decoder \
		--disable-vp9 \
		--enable-realtime-only \
		--enable-onthefly-bitpacking \
		--disable-temporal-denoising \
		--disable-spatial-resampling \
		--extra-cflags="$(CFLAGS) $(SIMDFLAGS)"
	@touch $@

build/libvpx/dist/lib/libvpx.so: build/libvpx/Makefile
	sed -i -E 's~NM=.*~NM=llvm-nm~' build/libvpx/*.mk
	sed -i -E 's~python.*\\\\(\w+)~\\1~' build/libvpx/*.mk
	cd build/libvpx && emmake make -j8 && emmake make install && cp libvpx.so dist/lib

# TODO(Kagami): Emscripten documentation recommends to always use shared
# libraries but it's not possible in case of ffmpeg because it has
# multiple declarations of `ff_log2_tab` symbol. GCC builds FFmpeg fine
# though because it uses version scripts and so `ff_log2_tag` symbols
# are not exported to the shared libraries. Seems like `emcc` ignores
# them. We need to file bugreport to upstream. See also:
# - <https://kripken.github.io/emscripten-site/docs/compiling/Building-Projects.html>
# - <https://github.com/kripken/emscripten/issues/831>
# - <https://ffmpeg.org/pipermail/libav-user/2013-February/003698.html>
FFMPEG_ARGS = \
	--cc=emcc \
	--cxx=em++ \
	--ar=emar \
	--ranlib=emranlib \
	--nm=llvm-nm \
	--enable-cross-compile \
	--target-os=none \
	--arch=x86 \
	--disable-runtime-cpudetect \
	--disable-swscale-alpha \
	--disable-safe-bitstream-reader \
	--disable-inline-asm \
	--disable-asm \
	--disable-fast-unaligned \
	--disable-pthreads \
	--disable-w32threads \
	--disable-os2threads \
	--disable-debug \
	--disable-stripping \
	--disable-everything \
	\
	--disable-all \
	--enable-gpl \
	--enable-lto \
	--enable-ffplay \
	--enable-avcodec \
	--enable-avformat \
	--enable-avutil \
	--enable-swresample \
	--enable-swscale \
	--enable-avfilter \
	--disable-network \
	--disable-d3d11va \
	--disable-dxva2 \
	--disable-vaapi \
	--disable-vdpau \
	$(addprefix --enable-decoder=,$(DECODERS)) \
	$(addprefix --enable-demuxer=,$(DEMUXERS)) \
	$(addprefix --enable-filter=,$(FILTERS)) \
	$(addprefix --enable-parser=,$(PARSERS)) \
	--disable-doc \
	--disable-htmlpages \
	--disable-manpages \
	--disable-podpages \
	--disable-txtpages \
	--disable-bzlib \
	--disable-iconv \
	--disable-libxcb \
	--disable-lzma \
	--disable-sdl2 \
	--disable-autodetect \
	--disable-securetransport \
	--disable-xlib \
	--disable-zlib

build/ffmpeg/config.h: .git/modules/build/ffmpeg/FETCH_HEAD
	cd build/ffmpeg && \
	git reset --hard && \
	patch -p1 < ../ffmpeg.patch && \
	emconfigure ./configure \
		$(FFMPEG_ARGS) \
		$(addprefix --enable-encoder=,$(ENCODERS)) \
		$(addprefix --enable-muxer=,$(MUXERS)) \
		--enable-libopus \
		--enable-libvpx \
		--extra-cflags="$(CFLAGS) -I../libvpx/dist/include -I../opus/dist/include -I../opus/dist/include/opus" \
		--extra-ldflags="$(CFLAGS) -L../libvpx/dist/lib -lvpx -L../opus/dist/lib -lopus"
	@touch $@

$(AVCODEC_BC): $(SHARED_DEPS) build/ffmpeg/config.h build/ffmpeg/libavcodec/libvpxenc.c
	cd build/ffmpeg && emmake make -j8

build/%.o: build/%.cpp
	$(CXX) $(CXXFLAGS) $(INCLUDES) -c $< -o $@

$(POST_JS): build/avcodec.idl $(EMPATH)/tools/webidl_binder.py
	python $(EMPATH)/tools/webidl_binder.py build/avcodec.idl build/avcodec.glue
	-@rm $(OBJS)

$(TARGET): $(AVCODEC_BC) $(PRE_JS) $(POST_JS) $(OBJS) Makefile
	$(CXX) $(CXXFLAGS) $(OBJS) $(LDFLAGS) -o $@
	@sed -i -E 's~var ensureCache~if(0)x~' $@
	@sed -i -E 's~function _emscripten_memcpy_big[^{]+[^}]+}~~' $@
	@sed -i -E 's~_emscripten_memcpy_big,~function(a,b,c)\{HEAPU8.copyWithin(a,b,b+c)\},~' $@
	@uglifyjs -c pure_getters=true,reduce_vars=false,sequences=false,passes=2 -b indent_level=2,width=120 -o $@ $@

install: $(TARGET)
	cp $(TARGET:.js=.wasm) ../../webclient
	cp $(TARGET) ../../webclient #/js/vendor
