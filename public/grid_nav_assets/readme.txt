# Description

Assets used for debugging "roomz on the web", panning between soundscapes on users smartphones as they move around.


# Content

- 0_debug_grid: mono audio files, one per potential user position, used as placeholders to test knn and panning algorithm

- 1_binaural_encoded: binaural audio files, one per potential user position, used for testing basic stereo streaming + panning

- 2_ambisonic_encoded_2nd: same as 1_binaural_encoded but ambisonic (ACN SN3D 2nd), used for testing multi-channel streaming + ambisonic decoding

- 3_binaural_rirs: binaural rirs, one for each source x user position, used for testing real-time binaural convolution

- 4_ambisonic_rirs_2nd: same as 3_binaural_rirs but ambisonic (ACN SN3D 2nd), used for testing real-time ambisonic convolution

- assets: additional assets used to create the files above and describe the scene

- generate.m: matlab file used to generate 1_binaural_encoded, 2_ambisonic_encoded_2nd, and 3_binaural_rirs from 4_ambisonic_rirs_2nd. 4_ambisonic_rirs_2nd is a direct copy of Roomz Sainte Elisabeth RIRs at /Miles/Projets/Eglise_Sainte_Elisabeth_Hongrie/2021_10_26_st_elizabeth_3d_ir/output/irs/irs_ambisonic_acn